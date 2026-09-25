import { describe, expect, it } from "vitest";

import {
  AVATAR_MAX_BYTES,
  avatarKeyFor,
  avatarKeyFromUrl,
  contentTypeForKey,
  isServableMediaKey,
  sniffImageType,
  validateAvatarUpload,
} from "@/lib/media";

/**
 * Pure validation rules for member photo uploads (Sprint 13). The server must
 * never trust the browser-declared MIME type – the magic bytes decide.
 */

const JPEG_HEAD = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
const PNG_HEAD = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const WEBP_HEAD = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];
const GIF_HEAD = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];

describe("sniffImageType (magic bytes)", () => {
  it("recognises JPEG, PNG and WebP", () => {
    expect(sniffImageType(new Uint8Array(JPEG_HEAD))).toBe("image/jpeg");
    expect(sniffImageType(new Uint8Array(PNG_HEAD))).toBe("image/png");
    expect(sniffImageType(new Uint8Array(WEBP_HEAD))).toBe("image/webp");
  });

  it("rejects other content (e.g. GIF, PDF, text) and empty files", () => {
    expect(sniffImageType(new Uint8Array(GIF_HEAD))).toBeNull();
    expect(sniffImageType(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBeNull();
    expect(sniffImageType(new Uint8Array(0))).toBeNull();
  });
});

describe("validateAvatarUpload", () => {
  it("accepts the supported types up to the size limit", () => {
    expect(validateAvatarUpload(1234, new Uint8Array(JPEG_HEAD), "image/jpeg")).toEqual({
      ok: true,
      type: "image/jpeg",
      extension: "jpg",
    });
    expect(validateAvatarUpload(AVATAR_MAX_BYTES, new Uint8Array(WEBP_HEAD), "image/webp")).toMatchObject({
      ok: true,
      type: "image/webp",
    });
  });

  it("rejects oversize, empty and mislabelled files", () => {
    expect(validateAvatarUpload(AVATAR_MAX_BYTES + 1, new Uint8Array(PNG_HEAD), "image/png")).toEqual({
      ok: false,
      reason: "tooLarge",
    });
    expect(validateAvatarUpload(0, new Uint8Array(PNG_HEAD), "image/png")).toEqual({ ok: false, reason: "empty" });
    // Declared as PNG but really a GIF: the content decides.
    expect(validateAvatarUpload(10, new Uint8Array(GIF_HEAD), "image/png")).toEqual({
      ok: false,
      reason: "unsupportedType",
    });
  });
});

describe("storage keys and URLs", () => {
  it("builds per-user keys with a safe extension", () => {
    expect(avatarKeyFor("usr_abc123", "png", "lz3k0x-a1b2c3d4e5f6")).toBe(
      "avatars/usr_abc123/lz3k0x-a1b2c3d4e5f6.png",
    );
    // Hostile input cannot escape the avatars/<userId>/ folder.
    expect(avatarKeyFor("../etc", "png", "../../etc/passwd")).toBe("avatars/etc/etcpasswd.png");
  });

  it("extracts keys only from the member's own media URLs", () => {
    expect(avatarKeyFromUrl("/api/media/avatars/usr_abc/x.png", "usr_abc")).toBe("avatars/usr_abc/x.png");
    // Foreign CDN URLs are external media – never managed, never deleted.
    expect(avatarKeyFromUrl("https://cdn.example/avatars/usr_abc/x.png", "usr_abc")).toBeNull();
    // Foreign users' objects and external URLs are never touched.
    expect(avatarKeyFromUrl("/api/media/avatars/usr_other/x.png", "usr_abc")).toBeNull();
    expect(avatarKeyFromUrl("https://images.example/some/where.jpg", "usr_abc")).toBeNull();
    expect(avatarKeyFromUrl("/api/media/avatars/usr_abc/../etc", "usr_abc")).toBeNull();
  });

  it("validates keys for the public serving route", () => {
    expect(isServableMediaKey("avatars/usr_abc123/photo-xyz.webp")).toBe(true);
    expect(isServableMediaKey("avatars/usr_abc123/photo.webp")).toBe(true);
    expect(isServableMediaKey("avatars/usr_abc123/photo.gif")).toBe(false);
    expect(isServableMediaKey("avatars/usr_abc123")).toBe(false);
    expect(isServableMediaKey("avatars/usr_ABC/../../secret.png")).toBe(false);
    expect(isServableMediaKey("private/usr_abc123/photo.png")).toBe(false);
  });

  it("maps extensions to content types", () => {
    expect(contentTypeForKey("avatars/usr_abc/a.jpg")).toBe("image/jpeg");
    expect(contentTypeForKey("avatars/usr_abc/a.webp")).toBe("image/webp");
    expect(contentTypeForKey("avatars/usr_abc/a.bin")).toBe("application/octet-stream");
  });
});
