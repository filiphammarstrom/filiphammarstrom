import Foundation
import Security

enum KeychainHelper {
    static func save(password: String, label: String) throws {
        let data = Data(password.utf8)
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrLabel:   label,
            kSecAttrAccount: label,
            kSecValueData:   data
        ]

        // Delete existing item first to allow update
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw NASBackupError.keychainSaveFailed(status)
        }
    }

    static func retrieve(label: String) throws -> String {
        let query: [CFString: Any] = [
            kSecClass:            kSecClassGenericPassword,
            kSecAttrAccount:      label,
            kSecReturnData:       true,
            kSecMatchLimit:       kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let data = result as? Data,
              let password = String(data: data, encoding: .utf8) else {
            throw NASBackupError.keychainReadFailed(status)
        }

        return password
    }

    static func delete(label: String) throws {
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrAccount: label
        ]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw NASBackupError.keychainDeleteFailed(status)
        }
    }
}
