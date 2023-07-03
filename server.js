const express = require("express");
const app = express();
const path = require("path");
// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });

const stripe = require("stripe")('sk_test_51NL22ySFFyI3Zc11Shgr6QCgEFYLFFZYXN8Y6Kv1fCIRKrWyRgFlkkoIzm3jRTJYunAyLbNeYSc2JDDpob4qAtzL00OkJPi7fr', {
  apiVersion: "2022-08-01",
});


app.use(express.json());
app.use(express.urlencoded());
app.use(express.static("static"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

const paypal = require("@paypal/checkout-server-sdk")
const Environment = paypal.core.SandboxEnvironment
  // process.env.NODE_ENV === "production"
  //   ? paypal.core.LiveEnvironment
  //   : paypal.core.SandboxEnvironment
const paypalClient = new paypal.core.PayPalHttpClient(
  new Environment(
    'AbncT2gTxHZ-M81tlSkjLhR02HvVCToAKIlj_l9ndO4DBctoBePKAciJ8Vdka-wn_0pVGeqKA2CMicuh',
    'EIUhOKcxzgOrs2TQQdGS-d7-mzdfNVFTAEt9Uf3Rd-T5lbaXIxHUrHkVPnM5eBilG83uzg1IaMWCp9CG'
  )
)

app.post("/create-order", async (req, res) => {
  const request = new paypal.orders.OrdersCreateRequest()

  request.prefer("return=representation")
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "INR",
          value: req.body.amount,
          breakdown: {
            item_total: {
              currency_code: "INR",
              value: req.body.amount,
            },
          },
        },
      },
    ],
  })

  try {
    const order = await paypalClient.execute(request)
    res.json({ id: order.result.id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get("/config", (req, res) => {
  res.send({
    publishableKey: 'pk_test_51NL22ySFFyI3Zc117yNJduaqNLERLAvCbpDO01RuL4gFVFWhWBhyLGWsGfpvqrMhM42C4ddOrzNfUU4MR8y1KxEZ00wOMd6Bxr',
  });
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "INR",
      amount: parseInt(req.body.amount)*100,
      automatic_payment_methods: { enabled: true },
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.get('/completion', (req, res) => {
  res.sendFile(path.join(__dirname + '/complete.html'));
});

app.listen(3000, () =>
  console.log(`Listening at port 3000`)
);
