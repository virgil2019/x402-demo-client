import { paymentProxy } from "@x402/next";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { createPaywall } from "@x402/paywall";
import { evmPaywall } from "@x402/paywall/evm";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";

const facilitatorUrl = process.env.FACILITATOR_URL;
export const evmAddress = process.env.EVM_ADDRESS as `0x${string}`;

if (!facilitatorUrl) {
  console.error("❌ FACILITATOR_URL environment variable is required");
  process.exit(1);
}

if (!evmAddress) {
  console.error("❌ EVM_ADDRESS environment variables are required");
  process.exit(1);
}

// Create HTTP facilitator client
const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

// Create x402 resource server
export const server = new x402ResourceServer(facilitatorClient);

// Register schemes
registerExactEvmScheme(server);

// Build paywall
export const paywall = createPaywall()
  .withNetwork(evmPaywall)
  .withConfig({
    appName: process.env.APP_NAME || "Next x402 Demo",
    appLogo: process.env.APP_LOGO || "/x402-icon-blue.png",
    testnet: true,
  })
  .build();

// Build proxy
export const proxy = paymentProxy(
  {
    "/protected": {
      accepts: [
        {
          scheme: "exact",
          price: {
            amount: "10000000000000000",
            asset: "0xc2983537C79A8f82ce6A7903Fe1F14D4761dBD17",
            extra: {
              name: "XNY",
              version: "1",
            },
          },
          network: "eip155:84532",
          payTo: evmAddress,
        }
      ],
      description: "Premium music: x402 Remix",
      mimeType: "text/html",
      extensions: {
        ...declareDiscoveryExtension({}),
      },
    },
  },
  server,
  undefined, // paywallConfig (using custom paywall instead)
  paywall, // custom paywall provider
);

// Configure which paths the proxy should run on
export const config = {
  matcher: ["/protected/:path*"],
};
