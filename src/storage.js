// محاكاة واجهة window.storage (المتوفرة داخل بيئة Claude فقط)
// باستخدام localStorage الحقيقي في الجهاز، حتى يعمل التطبيق كتطبيق مستقل
// على الموبايل بدون أي اتصال بخوادم Anthropic.

const PREFIX = "daftari:";

function fullKey(key, shared) {
  return `${PREFIX}${shared ? "shared:" : "private:"}${key}`;
}

window.storage = {
  async get(key, shared = false) {
    const raw = localStorage.getItem(fullKey(key, shared));
    if (raw === null) {
      throw new Error(`key not found: ${key}`);
    }
    return { key, value: raw, shared };
  },

  async set(key, value, shared = false) {
    localStorage.setItem(fullKey(key, shared), value);
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    localStorage.removeItem(fullKey(key, shared));
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(`${PREFIX}${shared ? "shared:" : "private:"}${prefix}`))
      .map((k) => k.slice(`${PREFIX}${shared ? "shared:" : "private:"}`.length));
    return { keys, prefix, shared };
  },
};
