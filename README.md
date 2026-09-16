# FreshCart v4 — Complete Grocery E-commerce Front-End

## Included
- Proper Home page and persistent Home navigation
- 48 grocery products, 6 per category
- SVG icons instead of emojis
- Boxed category cards
- Product stock/inventory system (10 units initially)
- Low-stock and Out-of-stock states
- Cart quantity limits based on inventory
- Inventory deducted after placing an order
- Deals of the Day
- Best Sellers
- New Arrivals
- Popular Brands
- Customer reviews
- Why FreshCart section
- Newsletter subscription UI
- Product detail page with gallery, rating, description and related products
- Wishlist
- Search suggestions
- Category, brand, price and sorting filters
- Coupon codes: FRESH100 and SAVE50
- Free-delivery progress bar
- Multi-step-style checkout with address, delivery slot and payment
- Login / signup demo
- Account/profile page
- Saved address page
- Order confirmation
- My Orders
- Order tracking timeline
- Admin dashboard
- Admin stock editing
- Contact, FAQ, shipping, returns, privacy and terms pages
- LocalStorage for demo data
- Responsive desktop/tablet/mobile layout

## Demo routes
- `#/` Home
- `#/shop` Shop
- `#/deals` Deals
- `#/wishlist` Wishlist
- `#/cart` Cart
- `#/checkout` Checkout
- `#/orders` Orders
- `#/account` Account
- `#/addresses` Saved addresses
- `#/admin` Admin dashboard

## Coupons
- `FRESH100` = ₹100 off on ₹499+
- `SAVE50` = ₹50 off on ₹299+

## Important
This is a front-end project. Login, payment, inventory, orders and admin controls use browser LocalStorage for demonstration. For a real production store, connect a backend/database, secure authentication, real payment gateway, real inventory API, delivery service and server-side validation.

Product photos use Unsplash URLs, so an internet connection is needed for the photos. Replace them with your own local/product images before deployment.

## v4.1 fixes
- Hero grocery image no longer overlaps the headline/text; desktop uses a dedicated right image area.
- Mobile hero stacks the image below the text.
- Account registration now persists a local account record and validates duplicate email/password confirmation.
- Saved Addresses now has a dedicated add/edit form and Save Address button.
- Checkout continues to save the entered address to Saved Addresses before placing an order.
- Profile includes quick links to manage the saved address and checkout.
