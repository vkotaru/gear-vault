// This file adds custom type definitions to extend expect functionality in tests
import '@testing-library/jest-dom';

declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void;
      toHaveAttribute(attr: string, value?: string): void;
      toHaveTextContent(text: string): void;
      toBeVisible(): void;
      toBeDisabled(): void;
      toBeEnabled(): void;
      toBeInvalid(): void;
      toBeRequired(): void;
      toBeValid(): void;
      toBeChecked(): void;
      toBeEmptyDOMElement(): void;
      toHaveClass(className: string): void;
      toHaveFocus(): void;
      toHaveFormValues(values: Record<string, any>): void;
      toHaveStyle(style: Record<string, any>): void;
      toHaveValue(value: string | string[] | number): void;
      toContainHTML(html: string): void;
      toContainElement(element: HTMLElement): void;
    }
  }
}