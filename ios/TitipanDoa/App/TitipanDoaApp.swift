import SwiftUI
import WidgetKit

@main
struct TitipanDoaNativeApp: App {
    var body: some Scene { WindowGroup { CompanionView() } }
}
struct CompanionView: View {
    @State private var count = NativeCount()
    @State private var message = ""
    @State private var prayerID: String?
    @State private var reset = false
    private let burgundy = Color(red: 113/255, green: 63/255, blue: 75/255)
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    Text("Assalamualaikum").font(.largeTitle).fontDesign(.serif)
                    Text("Pendamping widget Tumpang Doa. Ia tidak berkongsi simpanan dengan Safari atau PWA.").foregroundStyle(.secondary)
                    if let prayer = NativeLibrary.prayers.first(where: { $0.id == prayerID }) ?? NativeLibrary.daily() {
                        Text(prayer.title).font(.title2).fontDesign(.serif)
                        Text(prayer.arabic).font(.system(size: 30)).frame(maxWidth: .infinity, alignment: .trailing).environment(\.layoutDirection, .rightToLeft)
                        Text(prayer.meaning)
                        Text(prayer.source).font(.caption)
                        Link("Buka bacaan dalam Tumpang Doa", destination: URL(string: "https://vasfplhsm.github.io/titipandoa/#doa/\(prayer.id)")!)
                    }
                    Divider()
                    Text("Kaunter aplikasi pendamping").font(.headline)
                    Text("Subhanallah · \(count.count) / \(count.target)").font(.title2).fontDesign(.serif)
                    Button("Tambah kiraan") { update(delta: 1) }.buttonStyle(.borderedProminent)
                    Button("Mula semula", role: .destructive) { reset = true }
                    Text(NativeCounterStore.sharesWithHost ? "App Group aktif: kaunter ini dikongsi dengan widget Subhanallah." : "Tanpa App Group, kaunter aplikasi dan kaunter widget berasingan. Tambah/reset kaunter widget melalui widget medium; pilih zikir dengan Edit Widget.").font(.caption).foregroundStyle(.secondary)
                    Link("Buka aplikasi web", destination: URL(string: "https://vasfplhsm.github.io/titipandoa/")!)
                    if !message.isEmpty { Text(message).foregroundStyle(.red).font(.caption) }
                    Text("Teks Arab al-Quran: QuranEnc melalui quran-json v3.1.2, Risan Bagja Pradana, CC BY-SA 4.0. Rujukan hadis pada setiap bacaan. Huraian makna Bahasa Melayu disediakan untuk Tumpang Doa.").font(.caption2).foregroundStyle(.secondary)
                }.padding(24)
            }.tint(burgundy).navigationTitle("Tumpang Doa")
                .onAppear { update() }
                .onOpenURL { url in prayerID = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "id" })?.value }
                .confirmationDialog("Kembali kepada sifar?", isPresented: $reset) { Button("Mula semula", role: .destructive) { update(reset: true) } }
        }
    }
    private func update(delta: Int? = nil, reset: Bool = false) {
        do { count = try NativeCounterStore.change("subhanallah", delta: delta, reset: reset); message = ""; WidgetCenter.shared.reloadTimelines(ofKind: "TitipanTasbih") }
        catch { message = "Kiraan belum dapat disimpan. Cuba lagi sebelum menutup aplikasi." }
    }
}
