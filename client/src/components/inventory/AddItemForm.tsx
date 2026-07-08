import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { insertItemSchema, type Item } from "@shared/schema";
import LocationPicker from "@/components/inventory/LocationPicker";
import { CATEGORIES } from "@/lib/categories";
import { STATUSES } from "@/lib/status";
import { useImageUpload } from "@/hooks/use-image-upload";
import { X, Plus, Upload, Image } from "lucide-react";

// Extend the schema for the form with some validation
const formSchema = insertItemSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.enum(["camping", "hiking", "biking", "water", "winter", "clothing", "electronics", "utilities", "other"]),
  owner: z.string().min(1, "Owner is required"),
  storageLocation: z.string().min(1, "Storage location is required"),
});

interface AddItemFormProps {
  /** When provided, the form edits this item instead of creating a new one. */
  item?: Item;
  /** Optional controlled open state (used for the standalone edit route). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AddItemForm({ item, open: controlledOpen, onOpenChange }: AddItemFormProps = {}) {
  const isEdit = !!item;
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) onOpenChange?.(value);
    else setInternalOpen(value);
  };
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Existing images to keep (edit mode). Removing one drops it from this list;
  // the server treats this as the authoritative "keep" set and appends uploads.
  const [keptImages, setKeptImages] = useState<string[]>(item?.imageUrls ?? []);

  const {
    selectedFiles, 
    previewUrls, 
    handleFileChange, 
    handleRemoveFile,
    resetFiles
  } = useImageUpload();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: item
      ? {
          name: item.name,
          description: item.description ?? "",
          brand: item.brand ?? "",
          category: item.category,
          owner: item.owner,
          isShared: item.isShared,
          locationId: item.locationId ?? null,
          spotId: item.spotId ?? null,
          storageLocation: item.storageLocation,
          storageAddress: item.storageAddress ?? "",
          condition: item.condition ?? "Good",
          imageUrls: item.imageUrls ?? [],
          status: item.status,
          lentTo: item.lentTo ?? "",
        }
      : {
          name: "",
          description: "",
          brand: "",
          category: "camping",
          owner: "",
          isShared: true,
          locationId: null,
          spotId: null,
          storageLocation: "",
          storageAddress: "",
          condition: "Good",
          imageUrls: [],
          status: "stored",
          lentTo: "",
        },
  });

  const itemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const formData = new FormData();

      // Append files to form data
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });
      }

      // Append item JSON data. In edit mode, send the images we're keeping so
      // the server can drop the removed ones; new files are appended server-side.
      const payload = isEdit ? { ...data, imageUrls: keptImages } : data;
      formData.append("item", JSON.stringify(payload));

      const response = await fetch(isEdit ? `/api/items/${item!.id}` : "/api/items", {
        method: isEdit ? "PUT" : "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(isEdit ? "Failed to update item" : "Failed to add item");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: [`/api/items/${item!.id}`] });
      }

      toast({
        title: "Success",
        description: isEdit ? "Item was updated successfully" : "Item was added successfully",
      });

      if (!isEdit) {
        form.reset();
        resetFiles();
      }
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "add"} item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    itemMutation.mutate(values);
  }

  const fileInputRef = useState<HTMLInputElement | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Add New Item
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{isEdit ? "Edit Equipment" : "Add New Equipment"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details below. Uploading photos adds to the existing ones."
              : "Fill out the form below to add a new item to the inventory."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand/Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter brand or model" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner*</FormLabel>
                    <FormControl>
                      <Input placeholder="Who owns this item?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="storageLocation"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Storage Location*</FormLabel>
                    <FormControl>
                      <LocationPicker
                        locationId={form.watch("locationId") ?? null}
                        spotId={form.watch("spotId") ?? null}
                        onChange={(sel) => {
                          form.setValue("locationId", sel.locationId, { shouldValidate: true });
                          form.setValue("spotId", sel.spotId);
                          form.setValue(
                            "storageLocation",
                            sel.spotName ? `${sel.locationName} — ${sel.spotName}` : sel.locationName,
                            { shouldValidate: true }
                          );
                          form.setValue("storageAddress", sel.address);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value ? `Selected: ${field.value}` : "Pick an existing location or add a new one."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "stored"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {form.watch("status") === "lent" && (
                <FormField
                  control={form.control}
                  name="lentTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lent to</FormLabel>
                      <FormControl>
                        <Input placeholder="Who has it?" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter item description"
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Image Upload */}
            <div>
              <FormLabel>Photos</FormLabel>

              {/* Existing photos (edit mode) — click X to remove */}
              {isEdit && keptImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2 mb-3">
                  {keptImages.map((url) => (
                    <div key={url} className="relative h-20 bg-muted rounded overflow-hidden">
                      <img src={url} alt="Item photo" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setKeptImages((prev) => prev.filter((u) => u !== url))}
                        className="absolute top-0 right-0 bg-destructive text-destructive-foreground p-1 rounded-bl-md"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  id="file-upload"
                  type="file" 
                  className="hidden" 
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-2">Drag photos here or click to upload</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('file-upload')?.click();
                  }}
                >
                  Upload Photos
                </Button>
              </div>
              
              {/* Preview of selected images */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative h-20 bg-muted rounded overflow-hidden">
                      <img src={url} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-0 right-0 bg-destructive text-destructive-foreground p-1 rounded-bl-md"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="isShared"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      This item is available for others to borrow
                    </FormLabel>
                    <FormDescription>
                      If checked, this item will be visible in the shared gear section.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={itemMutation.isPending}
              >
                {itemMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEdit ? "Saving..." : "Adding..."}
                  </>
                ) : (
                  isEdit ? 'Save Changes' : 'Add Item'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
