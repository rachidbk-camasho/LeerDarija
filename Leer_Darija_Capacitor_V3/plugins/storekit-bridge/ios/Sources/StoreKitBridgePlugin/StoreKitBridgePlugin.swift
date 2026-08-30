import Foundation
import StoreKit
import Capacitor

@objc(StoreKitBridgePlugin)
public class StoreKitBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoreKitBridgePlugin"
    public let jsName = "StoreKitBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlements", returnType: CAPPluginReturnPromise)
    ]

    @objc func getProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("ids", String.self) ?? []
        Task {
            do {
                let products = try await Product.products(for: ids)
                let payload: [[String: Any]] = products.map { p in
                    ["id": p.id, "displayName": p.displayName, "description": p.description, "displayPrice": p.displayPrice]
                }
                call.resolve(["products": payload])
            } catch { call.reject("Could not load products", nil, error) }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("Missing product id"); return }
        Task {
            do {
                guard let product = try await Product.products(for: [id]).first else { call.reject("Product not found"); return }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        call.resolve(["purchased": true, "productId": transaction.productID])
                    case .unverified(_, let error): call.reject("Transaction could not be verified", nil, error)
                    }
                case .pending: call.resolve(["purchased": false, "pending": true])
                case .userCancelled: call.reject("Purchase cancelled", "USER_CANCELLED")
                @unknown default: call.reject("Unknown purchase result")
                }
            } catch { call.reject("Purchase failed", nil, error) }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do { try await AppStore.sync(); call.resolve(["restored": true]) }
            catch { call.reject("Restore failed", nil, error) }
        }
    }

    @objc func getEntitlements(_ call: CAPPluginCall) {
        Task {
            var ids: [String] = []
            for await result in Transaction.currentEntitlements {
                if case .verified(let transaction) = result, transaction.revocationDate == nil { ids.append(transaction.productID) }
            }
            call.resolve(["productIds": ids])
        }
    }
}
