import Foundation
import Darwin

struct Prayer: Codable, Identifiable {
    let id: String
    let title: String
    let arabic: String
    let meaning: String
    let source: String
    let url: String
}

enum NativeLibrary {
    static var prayers: [Prayer] {
        guard let url = Bundle.main.url(forResource: "Library", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let rows = try? JSONDecoder().decode([Prayer].self, from: data) else { return [] }
        return rows
    }
    static func daily(at date: Date = Date()) -> Prayer? {
        let rows = prayers
        guard !rows.isEmpty else { return nil }
        var local = Calendar(identifier: .gregorian)
        local.timeZone = TimeZone(identifier: "Asia/Kuala_Lumpur")!
        var utc = Calendar(identifier: .gregorian)
        utc.timeZone = TimeZone(secondsFromGMT: 0)!
        let parts = local.dateComponents([.year, .month, .day], from: date)
        guard let day = utc.date(from: parts) else { return rows.first }
        let index = Int(floor(day.timeIntervalSince1970 / 86400))
        return rows[(index % rows.count + rows.count) % rows.count]
    }
    static func nextMidnight(after date: Date) -> Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Asia/Kuala_Lumpur")!
        return calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: date)) ?? date.addingTimeInterval(3600)
    }
}

struct NativeCount: Codable {
    var count: Int = 0
    var target: Int = 33
}

// Optional: set this to an App Group that both targets are actually entitled to use.
// Leave nil for free-signing fallback: extension-owned counts, independent from the host app and PWA.
enum NativeCounterStore {
    static let appGroup: String? = nil
    static var sharesWithHost: Bool {
        guard let group = appGroup else { return false }
        return FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group) != nil
    }
    private static func folder() throws -> URL {
        let manager = FileManager.default
        let base: URL
        if let group = appGroup,
           let groupURL = manager.containerURL(forSecurityApplicationGroupIdentifier: group) {
            base = groupURL.appendingPathComponent("TitipanDoaCounts", isDirectory: true)
        } else {
            base = try manager.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
                .appendingPathComponent("TitipanDoaCounts", isDirectory: true)
        }
        try manager.createDirectory(at: base, withIntermediateDirectories: true)
        return base
    }
    @discardableResult
    static func change(_ id: String, target: Int = 33, delta: Int? = nil, reset: Bool = false) throws -> NativeCount {
        let directory = try folder()
        let lockURL = directory.appendingPathComponent("counts.lock")
        let descriptor = open(lockURL.path, O_CREAT | O_RDWR, S_IRUSR | S_IWUSR)
        guard descriptor >= 0 else { throw CocoaError(.fileWriteUnknown) }
        defer { flock(descriptor, LOCK_UN); close(descriptor) }
        guard flock(descriptor, LOCK_EX) == 0 else { throw CocoaError(.fileWriteUnknown) }
        let url = directory.appendingPathComponent("counts.json")
        var counts: [String: NativeCount] = [:]
        if FileManager.default.fileExists(atPath: url.path) {
            counts = try JSONDecoder().decode([String: NativeCount].self, from: Data(contentsOf: url))
        }
        var current = counts[id] ?? NativeCount(count: 0, target: max(1, target))
        if reset { current.count = 0 }
        if let step = delta, step > 0 { current.count = current.count > Int.max - step ? Int.max : current.count + step }
        if reset || delta != nil {
            counts[id] = current
            try JSONEncoder().encode(counts).write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        }
        return current
    }
}
