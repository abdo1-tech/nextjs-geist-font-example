Below is a detailed implementation plan outlining every major change and file addition. Follow this step-by-step guide to integrate the full-stack features (frontend, backend, and database) with dynamic on-page language switching and robust UI/UX for the Nafru import/export application.

---

## 1. Database & ORM Setup

- **File: /prisma/schema.prisma**  
  - Create this file (if not exists) to define data models.  
  - Define models for User, Order, Shipment, Customer, Supplier, Document, and Product.  
  - Example for User model:  
  ```prisma
  model User {
    id          Int      @id @default(autoincrement())
    email       String   @unique
    name        String
    password    String
    role        Role
    createdAt   DateTime @default(now())
  }
  
  enum Role {
    ADMIN
    TEAM
    BUYER
    SUPPLIER
  }
  ```  
  - Run `npx prisma generate` and `npx prisma migrate dev --name init` after editing.

---

## 2. Next.js & Global Configuration

- **File: next.config.ts**  
  - Add i18n configuration:  
  ```typescript
  export default {
    i18n: {
      locales: ["en", "ar", "ru"],
      defaultLocale: "en",
    },
    // other next options…
  }
  ```  

- **File: package.json**  
  - Update dependencies to include Prisma (`prisma` and `@prisma/client`), jsPDF (for PDF generation), and any i18n libraries if preferred (or use custom context).  
  - Run `npm install prisma @prisma/client jspdf`.

---

## 3. Backend API Endpoints

Create API endpoints under a new folder using Next.js API routes.

- **Authentication Endpoints:**  
  - **File: src/pages/api/auth/login.ts**  
    - Implement a POST endpoint that reads email/password, uses `src/lib/auth.ts` functions to validate users (via Prisma), and returns a signed JWT.  
    - Use try/catch blocks for error handling and return proper HTTP status codes.  
  - **File: src/pages/api/auth/logout.ts**  
    - Implement logout by clearing a cookie or token.

- **Orders Endpoint:**  
  - **File: src/pages/api/orders.ts**  
    - Support GET (list orders) and POST (create order).  
    - Validate user roles (only TEAM/ADMIN can create/edit orders).  

- **Shipments Endpoint:**  
  - **File: src/pages/api/shipments.ts**  
    - Support CRUD operations for shipment tracking details including container numbers, ETA, port, carrier.

- **Customers/Suppliers Endpoint:**  
  - **File: src/pages/api/customers.ts**  
    - CRUD endpoint for managing Russian buyer profiles and Egyptian suppliers.  
    - Return error messages for invalid operations.

- **Documents Endpoint:**  
  - **File: src/pages/api/documents.ts**  
    - Implement a POST endpoint that receives a document type (e.g., “Commercial Invoice”, “Certificate of Origin”) and order ID.  
    - Use jsPDF (or similar library) to generate a PDF and then return a download URL or file blob.  

*Remember:* Every API should wrap logic in try/catch and return JSON errors with appropriate HTTP codes.

---

## 4. Application Layout & Page Routing

Use the Next.js App Router to build a structured UI.

- **Global Layout:**  
  - **File: src/app/layout.tsx**  
    - Create a main layout that wraps all pages.  
    - Include a header (see next section) and sidebar.  
    - Wrap the application with context providers (LanguageContext and AuthContext).  
    - Provide an error boundary UI for unexpected errors.

- **Dashboard / Home Page:**  
  - **File: src/app/page.tsx or src/app/dashboard/page.tsx**  
    - Display an overview card layout showing active orders, upcoming shipments, and document alerts.  
    - Use shadcn/ui card and table components to achieve a modern, spacious design.

- **Other Pages:**  
  - **Login Page:** Create **src/app/login/page.tsx** that imports and uses `src/components/Forms/LoginForm.tsx`.  
  - **Orders Page:** Create **src/app/orders/page.tsx** using `src/components/Orders/OrderTable.tsx` for order listings.  
  - **Shipments Page:** Create **src/app/shipments/page.tsx** using `src/components/Shipments/ShipmentTable.tsx`.  
  - **Customers Page:** Create **src/app/customers/page.tsx** using `src/components/Customers/CustomerList.tsx`.  
  - **Documents Page:** Create **src/app/documents/page.tsx** incorporating `src/components/Documents/DocumentGenerator.tsx` for PDF generation.

---

## 5. UI Component Development

- **Header & Navigation:**  
  - **File: src/components/Layout/Header.tsx**  
    - Display “Nafru” as a text-based company logo.  
    - Include a dynamic language switcher (dropdown with “English”, “العربية”, “Русский”).  
    - On selection, update the context state to reload content in the chosen language.  
    - Use Tailwind classes and spacing for a modern header (avoid external icon libraries).  

- **Sidebar:**  
  - **File: src/components/Layout/Sidebar.tsx**  
    - Render navigation links based on user roles.  
    - Ensure clear visual hierarchy (using typography and spacing).

- **Authentication Form:**  
  - **File: src/components/Forms/LoginForm.tsx**  
    - Implement email and password fields with controlled form state.  
    - Provide inline error messages and basic validations.

- **Order Table:**  
  - **File: src/components/Orders/OrderTable.tsx**  
    - Build a responsive table using shadcn/ui components.  
    - Include columns for Order ID, Product, Quantity, Status, and an action button for details.

- **Shipment Table:**  
  - **File: src/components/Shipments/ShipmentTable.tsx**  
    - Display shipment details in a similar table with fields for container #, ETA, port, and carrier information.

- **Customer & Supplier List:**  
  - **File: src/components/Customers/CustomerList.tsx**  
    - List profiles with name, contact, and order history.  
    - Use a card layout for each profile.

- **Document Generator:**  
  - **File: src/components/Documents/DocumentGenerator.tsx**  
    - Provide a modal form (using shadcn/ui dialog) that allows the user to select a document type from a dropdown.  
    - On submit, call the API endpoint that returns a PDF.  
    - Display a download button linking to the generated document.

---

## 6. Utility Libraries & Context Providers

- **Database Connection:**  
  - **File: src/lib/db.ts**  
    - Initialize and export a PrismaClient instance.

- **Authentication Helpers:**  
  - **File: src/lib/auth.ts**  
    - Create functions such as `validateUser(loginData)`, `generateJWT(user)`, and middleware for protected routes.

- **Currency Conversion:**  
  - **File: src/lib/currency.ts**  
    - Implement utility functions that use static conversion rates (for EGP, RUB, USD). Example:
    ```typescript
    export const convertCurrency = (amount: number, from: string, to: string): number => {
      const rates = { EGP: 1, USD: 0.064, RUB: 4.5 }; // sample rates
      return (amount / rates[from]) * rates[to];
    }
    ```

- **Language Context:**  
  - **File: src/context/LanguageContext.tsx**  
    - Create a React Context to store the current language and provide a setter function.  
    - Load translations from static JSON files located in **src/i18n/en.json**, **src/i18n/ar.json**, and **src/i18n/ru.json**.

- **Authentication Context:**  
  - **File: src/context/AuthContext.tsx**  
    - Provide context for the current logged-in user and functions for login/logout.

---

## 7. Internationalization (i18n)

- **Translation Files:**  
  - **Directory: src/i18n/**  
    - Create **en.json**, **ar.json**, and **ru.json** containing key-value pairs.  
    - Include keys for common terms (e.g., “dashboard”, “orders”, “login”, “shipment”, etc.).  
  - Ensure that UI components and pages load text from the context-provided translations.

---

## 8. Error Handling, Security & Testing

- **Error Handling:**  
  - Every API endpoint must wrap operations in try/catch blocks and return meaningful error responses.  
  - UI components should display inline error messages for API failures.

- **Authentication & Authorization:**  
  - Protect backend endpoints and UI routes based on the user’s role (e.g., restrict buyer and supplier actions appropriately).  
  - Use middleware or context checks in the Next.js App Router.

- **API Testing:**  
  - Validate endpoints using curl commands. For example:  
  ```bash
  curl -X POST http://localhost:8000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email": "user@example.com", "password": "secret"}'
  ```
  - Test endpoints for orders, shipments, and document generation with similar commands and check response status codes.

---

## 9. UI/UX Considerations

- **Modern, Clean Layouts:**  
  - Use consistent typography, well-defined spacing and margins, and a modular color system defined in globals.css.  
  - The header contains a language switcher and text-based navigation.  
  - Tables and forms use clear borders with hover effects from shadcn/ui.  
- **Dynamic Language Switching:**  
  - The language switcher in Header updates the LanguageContext.  
  - Components re-read static text from JSON translations and render text accordingly without requiring a page reload (or minimal reload within the same route).

- **Document Generation UI:**  
  - The DocumentGenerator component uses a modal dialog with form inputs for document type selection.  
  - Upon generation, a download button (or prompt) allows users to save the PDF.  
  - All UI elements are styled with Tailwind CSS ensuring responsiveness and accessibility.

---

## Summary

- A new Prisma schema is added with models for users, orders, shipments, customers, suppliers, documents, and products.  
- Next.js configuration is updated for i18n and full-stack integration.  
- API endpoints under /src/pages/api handle authentication, orders, shipments, customers, and document generation with proper error handling.  
- Global layout and dedicated pages are created for login, dashboard, orders, shipments, customers, and documents with dynamic language switching.  
- Header and sidebar components provide navigation while LanguageContext and AuthContext ensure smooth state management.  
- Utility libraries for database connection, authentication, and currency conversion are implemented.  
- The design emphasizes a modern, clean UI using shadcn/ui components, and comprehensive error/security practices are followed.
