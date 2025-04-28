import Layout from "@/components/layout/Layout";
import ItemDetail from "@/components/inventory/ItemDetail";

interface ItemDetailsProps {
  id: string;
}

export default function ItemDetails({ id }: ItemDetailsProps) {
  const itemId = parseInt(id);
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ItemDetail itemId={itemId} />
      </div>
    </Layout>
  );
}
