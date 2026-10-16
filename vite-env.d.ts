/// <reference types="vite/client" />

declare module "react-image-crop/dist/ReactCrop.css";

interface ImportMetaEnv {
	
	readonly VITE_SUPABASE_URL?: string;
	readonly VITE_SUPABASE_ANON_KEY?: string;
	readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
	readonly SUPABASE_SERVICE_ROLE_KEY?: string;
	readonly SUPABASE_SECRET_KEY?: string;
}
