import QRCode from "qrcode";

// Encodes the raw token as plain text, never a URL — see the "Global
// Constraints" note in the plan this file was built from: a public link
// that marks attendance on load would let anyone self-check-in just by
// opening it.
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 512,
    color: { dark: "#0e2118", light: "#ffffff" },
  });
}
