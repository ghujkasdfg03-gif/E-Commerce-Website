import { Routes, Route } from "react-router-dom";
import HomePage from "@/app/page";
import ProductsPage from "@/app/products/page";
import CartPage from "@/app/cart/page";
import LoginPage from "@/app/login/page";
import SignupPage from "@/app/signup/page";
import AccountPage from "@/app/account/page";
import AccountOrdersPage from "@/app/account/orders/page";
import AccountAddressesPage from "@/app/account/addresses/page";
import AccountWishlistPage from "@/app/account/wishlist/page";
import CheckoutPage from "@/app/checkout/page";
import AdminPage from "@/app/admin/page";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import ProductDetailsPage from "./pages/ProductDetailsPage";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/account/orders" element={<AccountOrdersPage />} />
              <Route
                path="/account/addresses"
                element={<AccountAddressesPage />}
              />
              <Route
                path="/account/wishlist"
                element={<AccountWishlistPage />}
              />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
