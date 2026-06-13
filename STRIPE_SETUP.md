# Stripe setup

GrowCore uses Stripe-hosted Checkout. Card data is entered on Stripe's page, and
the backend marks orders as paid only after a signed Stripe webhook confirms the
payment.

## 1. Stripe dashboard

1. Create or open your Stripe account.
2. In Developers > API keys, copy the Secret key.
3. In Developers > Webhooks, add this endpoint:

```text
https://growcore.onrender.com/orders/stripe/webhook
```

4. Subscribe the endpoint to:

```text
checkout.session.completed
```

5. Copy the webhook signing secret.

## 2. Render backend environment

Set these variables on the backend service:

```env
STRIPE_SECRET_KEY=sk_test_or_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=eur
STRIPE_AUTOMATIC_TAX=false
STRIPE_SHIPPING_ALLOWED_COUNTRIES=PT,ES,FR,DE,NL,BE,IT
FRONTEND_URL=https://grow-core.vercel.app
```

Redeploy the backend after changing env variables.

`STRIPE_SHIPPING_ALLOWED_COUNTRIES` limits the countries available in Stripe
Checkout. Keep `STRIPE_AUTOMATIC_TAX=false` unless tax calculation is configured,
because automatic tax can require additional billing address fields.

## 3. Vercel frontend

Keep the frontend API URL as:

```env
VITE_API_URL=/api
```

The frontend calls `/orders/{order_id}/stripe-checkout`, receives a Stripe
Checkout URL, and redirects the user there.

## 4. Test payments

Use Stripe test mode first. Stripe's test cards include:

```text
4242 4242 4242 4242 - successful payment
4000 0000 0000 9995 - declined payment
4000 0025 0000 3155 - 3D Secure authentication
```

After a successful test payment, Stripe sends the webhook, and the backend marks
the order as paid and removes purchased items from the cart.
