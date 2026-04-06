## General overview
This is a website for a cafeteria. We want it mobile first. The goal is for customers that are in the store to be able to scan a QR code so they can see the menu items, so they know what to order. For customers that want delivery, they will be able to make the order and select if they will pay cash or by credit card. The actual payment will be handled offline, so don't worry about this at all.

## General requirements
1. The website will have the cafeteria's menu
2. It will have a shopping cart - but NO payments. Users will simply select if they will pay cash or card.
3. The menu has to support both Greek and English through a language switcher
4. Users can optionally create a profile, which they can save address info, contact info, and have an order history with the last 5 orders, so they can reorder with a single click
5. We need CMS so that the people managing the cafeteria can update the menu on their own (keystatic is the obvious choice)
6. SSR is not mandatory but I think it's a strong plus in this case

## Views
1. Main view: It will show all categories with their items and prices, and a button to add to cart. For example:
```
Coffees
  espress ... $2.40
  americano ... $2.80

Teas
  black tea ... $2.50
  green tea ... $2.40

  etc...
```
2. Item view: It will show all details of an item
  a. image (if exists)
  b. title
  c. description
  d. quantity adjustment (in case a user wants more than one of this item)
  e. options that go along with it in subcategories. For example, a user can select if they want sugar, honey, or stevia in their tea (one subcategory), if they want milk or oatmilk or alternative (second subcategory), etc
  f. a textarea for comments in case we didn't cover them
3. checkout view - flow: As described already, no payment needed
4. profile view: optional, only for returning customers that want to save their data
5. Personnel view: Here the barristas and rest of personnel will be able to see the online orders. Let's start by a single user being able to access this, and we can add more in the future.

## Store flow
1. User scans a QR code to see the menu
2. Decides, walk up to the cashier, orders
3. Waits, gets his order

## Delivery flow
1. User logs in (or continues as guest)
2. Adds items in the shopping cart, following the views from above
3. Continues to checkout, where he selects if he wants to pay by cash or card
4. A success message appears
5. The personnel receives his order, prepares it, sends it over

## Considerations
1. This will serve at most a few hundreds customers a day
2. I haven't decided on the tech stack yet, but I am a senior web developer in TypeScript, React and Node.js. I am not tied to these, but I prefer to switch only if there is a clear win. For db I am mostly familiar with postgreSQL
3. I don't know yet where to host, but I would rather the cheapest option since the traffic will be low
4. I am already familiar with Contabo as a VPS platform, so that can be one choice - if there are no clear winners elsewhere