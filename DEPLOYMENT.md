# Deployment Guide: Galil Stay

This guide will help you deploy the "Galil Stay" application to production using **Netlify** (Recommended) or **Vercel**.

## Prerequisites
1.  **Supabase Project URL & Anon Key**: You need these from your Supabase Dashboard (`Settings` -> `API`).
2.  **GitHub Account** (Optional but recommended).

---

## Option 1: Deploy with Netlify (Drag & Drop - Easiest)

1.  **Build the Project Locally:**
    Open your terminal in the project folder and run:
    ```bash
    npm run build
    ```
    This will create a `dist` folder.

2.  **Upload to Netlify:**
    - Go to [app.netlify.com](https://app.netlify.com).
    - Drag and drop the `dist` folder into the "Sites" area.
    - Netlify will deploy your site instantly.

3.  **Configure Environment Variables:**
    - Go to **Site Settings** -> **Environment variables**.
    - Add the following variables (copy values from your local `.env` or Supabase):
        - `VITE_SUPABASE_URL`: [Your Supabase URL]
        - `VITE_SUPABASE_ANON_KEY`: [Your Supabase Anon Key]

4.  **Fix Routing (Important):**
    - Create a file named `_redirects` inside the `public` folder (if you haven't already) with this content:
      ```
      /*  /index.html  200
      ```
    - Re-run `npm run build` and re-deploy if you missed this.

---

## Option 2: Deploy via GitHub (Recommended for Updates)

1.  **Push to GitHub:**
    - Create a new repository on GitHub.
    - Push your code:
      ```bash
      git remote add origin https://github.com/YOUR_USERNAME/galil-stay.git
      git branch -M main
      git push -u origin main
      ```

2.  **Connect to Netlify/Vercel:**
    - Log in to Netlify/Vercel.
    - Click "New Site from Git".
    - Select your `galil-stay` repository.
    - **Build Command:** `npm run build`
    - **Publish Directory:** `dist`

3.  **Add Environment Variables:**
    - In the deploy setup screen, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## CRITICAL: Supabase Configuration

Once your site is live (e.g., `https://galil-stay.netlify.app`), you **MUST** update Supabase:

1.  **Go to Supabase Dashboard** -> `Authentication` -> `URL Configuration`.
2.  **Site URL:** Set this to your **Production URL** (e.g., `https://galil-stay.netlify.app`).
3.  **Redirect URLs:** Add your production URL to the "Redirect URLs" list.
    - `https://galil-stay.netlify.app/**`

**Without this step, authentication and redirects (like Magic Links) will fail!**

---
🚀 **Good luck with the launch!**
