# SPOT

## Deploy on Vercel

Create a Vercel project connected to this repository and keep **Root Directory**
at the repository root. Vercel uses `vercel.json` to run the dependency-free build
checks and publish `spot-site/dist`. The build also runs the site's functional and
comment tests.

The static files in `spot-site/dist` are the deployment input; keep them committed
to Git so Vercel receives the same site that was tested locally. No Vercel
environment variables are needed: the browser app connects directly to Supabase
using its public publishable key.

Before testing sign-in on the deployed domain, add the Vercel URL (and any custom
domain) to the Supabase project's **Authentication → URL Configuration** site URL
and redirect URL allowlist. Preview deployments need to be allowed there as well
if sign-in should work on preview URLs.