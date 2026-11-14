import WidgetKit
import SwiftUI
import AppIntents

private let burgundy = Color(red: 113/255, green: 63/255, blue: 75/255)
private let butter = Color(red: 215/255, green: 180/255, blue: 106/255)

enum ZikrChoice: String, CaseIterable, AppEnum {
    case subhanallah, alhamdulillah, allahuakbar, istighfar
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Zikir"
    static var caseDisplayRepresentations: [ZikrChoice: DisplayRepresentation] = [
        .subhanallah: "Subhanallah", .alhamdulillah: "Alhamdulillah",
        .allahuakbar: "Allahu Akbar", .istighfar: "Astaghfirullah"
    ]
    var title: String {
        switch self {
        case .subhanallah: return "Subhanallah"
        case .alhamdulillah: return "Alhamdulillah"
        case .allahuakbar: return "Allahu Akbar"
        case .istighfar: return "Astaghfirullah"
        }
    }
}
struct TasbihConfiguration: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Tetapan Tasbih"
    static var description = IntentDescription("Pilih zikir untuk kaunter widget ini. Bilangan sasaran ialah pilihan peribadi.")
    @Parameter(title: "Zikir", default: .subhanallah) var zikr: ZikrChoice
}
struct IncrementTasbihIntent: AppIntent {
    static var title: LocalizedStringResource = "Tambah Tasbih"
    static var openAppWhenRun = false
    @Parameter(title: "Zikir") var zikr: ZikrChoice
    init() {}
    init(zikr: ZikrChoice) { self.zikr = zikr }
    func perform() async throws -> some IntentResult {
        try NativeCounterStore.change(zikr.rawValue, delta: 1)
        WidgetCenter.shared.reloadTimelines(ofKind: "TitipanTasbih")
        return .result()
    }
}
struct ResetTasbihIntent: AppIntent {
    static var title: LocalizedStringResource = "Mula Semula Tasbih"
    static var openAppWhenRun = false
    @Parameter(title: "Zikir") var zikr: ZikrChoice
    init() {}
    init(zikr: ZikrChoice) { self.zikr = zikr }
    func perform() async throws -> some IntentResult {
        try await requestConfirmation(result: .result(dialog: "Kembali kepada sifar untuk zikir ini?"))
        try NativeCounterStore.change(zikr.rawValue, reset: true)
        WidgetCenter.shared.reloadTimelines(ofKind: "TitipanTasbih")
        return .result()
    }
}
struct PrayerEntry: TimelineEntry { let date: Date; let prayer: Prayer? }
struct PrayerProvider: TimelineProvider {
    func placeholder(in context: Context) -> PrayerEntry { PrayerEntry(date: .now, prayer: NativeLibrary.daily()) }
    func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) { completion(placeholder(in: context)) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
        let now = Date()
        completion(Timeline(entries: [PrayerEntry(date: now, prayer: NativeLibrary.daily(at: now))], policy: .after(NativeLibrary.nextMidnight(after: now))))
    }
}
struct PrayerWidgetView: View {
    let entry: PrayerEntry
    @Environment(\.widgetFamily) private var family
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("DOA HARI INI").font(.caption2).tracking(1).foregroundStyle(butter)
            if let prayer = entry.prayer {
                Text(prayer.title).font(.system(.headline, design: .serif)).lineLimit(2)
                Text(prayer.arabic).font(.system(size: family == .systemSmall ? 18 : 22)).lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .trailing).environment(\.layoutDirection, .rightToLeft)
                if family == .systemMedium { Text(prayer.meaning).font(.caption).lineLimit(2) }
                Text(prayer.source).font(.system(size: 9)).foregroundStyle(butter).lineLimit(1)
            } else { Text("Tambah Library.json ke sasaran widget.").font(.caption) }
        }.foregroundStyle(.white).containerBackground(burgundy, for: .widget)
            .widgetURL(URL(string: "titipandoa-native://doa?id=\(entry.prayer?.id ?? "")"))
    }
}
struct DailyPrayerWidget: Widget {
    let kind = "TitipanDailyPrayer"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerProvider()) { PrayerWidgetView(entry: $0) }
            .configurationDisplayName("Tumpang Doa · Doa Harian").description("Bacaan daripada katalog berbundel, tersedia tanpa internet.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}
struct TasbihEntry: TimelineEntry { let date: Date; let zikr: ZikrChoice; let value: NativeCount; let storageFailed: Bool }
struct TasbihProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> TasbihEntry { TasbihEntry(date: .now, zikr: .subhanallah, value: NativeCount(), storageFailed: false) }
    func snapshot(for configuration: TasbihConfiguration, in context: Context) async -> TasbihEntry { entry(configuration.zikr) }
    func timeline(for configuration: TasbihConfiguration, in context: Context) async -> Timeline<TasbihEntry> { let snapshot = entry(configuration.zikr); return Timeline(entries: [snapshot], policy: snapshot.storageFailed ? .after(Date().addingTimeInterval(900)) : .never) }
    private func entry(_ zikr: ZikrChoice) -> TasbihEntry {
        do { return TasbihEntry(date: .now, zikr: zikr, value: try NativeCounterStore.change(zikr.rawValue), storageFailed: false) }
        catch { return TasbihEntry(date: .now, zikr: zikr, value: NativeCount(), storageFailed: true) }
    }
}
struct TasbihWidgetView: View {
    let entry: TasbihEntry
    @Environment(\.widgetFamily) private var family
    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(entry.zikr.title).font(.system(.headline, design: .serif)).lineLimit(1)
            if entry.storageFailed { Text("Simpanan tidak tersedia").font(.caption).foregroundStyle(butter) }
            HStack(alignment: .center) {
                VStack(alignment: .leading) {
                    Text(entry.value.count.formatted()).font(.system(size: 42, weight: .medium, design: .serif)).minimumScaleFactor(0.35).lineLimit(1)
                    Text("/ \(entry.value.target) · Sasaran peribadi").font(.system(size: 9)).foregroundStyle(butter)
                }
                Spacer()
                Button(intent: IncrementTasbihIntent(zikr: entry.zikr)) { Image(systemName: "plus").font(.title2).frame(width: 44, height: 44) }
                    .buttonStyle(.bordered).tint(butter).disabled(entry.storageFailed)
            }
            if family == .systemMedium {
                HStack {
                    Text("Kiraan widget · berasingan daripada PWA").font(.system(size: 9))
                    Spacer()
                    Button(intent: ResetTasbihIntent(zikr: entry.zikr)) { Image(systemName: "arrow.counterclockwise").frame(width: 44, height: 44) }
                        .tint(butter).disabled(entry.storageFailed)
                }
            }
        }.foregroundStyle(.white).containerBackground(burgundy, for: .widget)
    }
}
struct DigitalTasbihWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "TitipanTasbih", intent: TasbihConfiguration.self, provider: TasbihProvider()) { TasbihWidgetView(entry: $0) }
            .configurationDisplayName("Tumpang Doa · Tasbih").description("Kaunter setempat yang boleh disentuh, tanpa internet.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}
@main
struct TitipanWidgetsBundle: WidgetBundle {
    var body: some Widget { DailyPrayerWidget(); DigitalTasbihWidget() }
}
