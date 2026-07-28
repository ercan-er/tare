import { registerOTel, OTLPHttpProtoTraceExporter } from "@vercel/otel";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

/**
 * OpenTelemetry kaydi. Next.js bu dosyayi her calisma ortami baslarken
 * bir kez cagiriyor.
 *
 * Disari aktarim OTLP / HTTP + protobuf. @vercel/otel'in exporter'i fetch
 * uzerine kurulu, yani hem Node hem edge calisma zamaninda ve Vercel'in
 * kisa omurlu fonksiyonlarinda calisiyor. Node'un http modulunu kullanan
 * klasik exporter'lar, fonksiyon donduktan sonra span'lari gonderemeden
 * kapanabiliyor.
 */

/**
 * OTEL_EXPORTER_OTLP_HEADERS bicimini cozer: "k1=v1,k2=v2".
 *
 * Bu, OpenTelemetry'nin standart ortam degiskeni bicimi. Basligi koda
 * gommek yerine burayi kullanmak, collector'in bekledigi baslik degisirse
 * yeniden derleme gerektirmiyor.
 */
function parseHeaders(raw: string | undefined): Record<string, string> {
  if (!raw) return {};

  const out: Record<string, string> = {};
  for (const pair of raw.split(",")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;

    const key = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

const LEVELS: Record<string, DiagLogLevel> = {
  none: DiagLogLevel.NONE,
  error: DiagLogLevel.ERROR,
  warn: DiagLogLevel.WARN,
  info: DiagLogLevel.INFO,
  debug: DiagLogLevel.DEBUG,
  verbose: DiagLogLevel.VERBOSE,
  all: DiagLogLevel.ALL,
};

export function register() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  // Endpoint yoksa izleme tamamen kapali. Uygulamanin geri kalani, tipki
  // Stripe ve Firebase'de oldugu gibi, yapilandirma olmadan da calisiyor.
  if (!endpoint) return;

  /**
   * Bunu acmak siddetle tavsiye edilir.
   *
   * @vercel/otel'in OTLP exporter'i fetch cozuldugu surece basari bildiriyor;
   * collector 400 ya da 401 dondurse bile hata gormezsiniz. Gercek HTTP
   * durumu yalnizca DEBUG seviyesinde "otlp: onSuccess <status>" satirinda
   * goruluyor. OTEL_LOG_LEVEL=debug olmadan basarisiz disari aktarim
   * tamamen sessiz kaliyor.
   */
  const level = LEVELS[(process.env.OTEL_LOG_LEVEL ?? "").toLowerCase()];
  if (level !== undefined) {
    diag.setLogger(new DiagConsoleLogger(), level);
  }

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "tare-storefront",
    traceExporter: new OTLPHttpProtoTraceExporter({
      // OTLP spesifikasyonu sinyal yolunu endpoint'e ekliyor.
      url: `${endpoint.replace(/\/+$/, "")}/v1/traces`,
      headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    }),
  });
}
