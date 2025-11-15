// open-next.config.ts
// This is a minimal config file to make the `opennext build` command non-interactive.
// It tells OpenNext to use the Cloudflare adapter.
import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({});