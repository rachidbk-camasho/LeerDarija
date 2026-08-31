export interface StoreProduct { id:string; displayName:string; description:string; displayPrice:string; }
export interface StoreKitBridgePlugin { getProducts(options:{ids:string[]}):Promise<{products:StoreProduct[]}>; purchase(options:{id:string}):Promise<{purchased:boolean;productId?:string;pending?:boolean}>; restore():Promise<{restored:boolean}>; getEntitlements():Promise<{productIds:string[]}>; }
export declare const StoreKitBridge: StoreKitBridgePlugin;
