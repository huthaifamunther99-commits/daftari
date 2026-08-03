import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import { backupData, restoreData } from "./firebase";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Plus, TrendingUp, TrendingDown, Wallet, Trash2, Search,
  X, Coins, Utensils, Car, Home, Zap, ShoppingBag, HeartPulse,
  Film, Briefcase, PiggyBank, MoreHorizontal, Sparkles,
  Bell, CheckCircle2, AlertTriangle, Store, User, ChevronLeft, ChevronDown, Menu, Package,
} from "lucide-react";

const INCOME_CATS = [
  { id: "راتب", icon: Briefcase, color: "#2F6F4E" },
  { id: "مبيعات", icon: Coins, color: "#3E8B63" },
  { id: "استثمار", icon: PiggyBank, color: "#4FA377" },
  { id: "أخرى", icon: MoreHorizontal, color: "#6FB88F" },
];

const EXPENSE_CATS = [
  { id: "طعام", icon: Utensils, color: "#A6462E" },
  { id: "مواصلات", icon: Car, color: "#B5573D" },
  { id: "سكن", icon: Home, color: "#C46B4E" },
  { id: "فواتير", icon: Zap, color: "#8B3A26" },
  { id: "تسوق", icon: ShoppingBag, color: "#CE8158" },
  { id: "صحة", icon: HeartPulse, color: "#993322" },
  { id: "ترفيه", icon: Film, color: "#D4936C" },
  { id: "أخرى", icon: MoreHorizontal, color: "#B87A5A" },
];

const ALL_CATS = [...INCOME_CATS, ...EXPENSE_CATS];
const catMeta = (name) => ALL_CATS.find((c) => c.id === name) || ALL_CATS[ALL_CATS.length - 1];

const DEFAULT_CURRENCY = "د.أ";
const CURRENCY_OPTIONS = [
  { value: "د.أ", label: "دينار أردني (د.أ)" },
  { value: "$", label: "دولار أمريكي ($)" },
  { value: "ر.س", label: "ريال سعودي (ر.س)" },
  { value: "ج.م", label: "جنيه مصري (ج.م)" },
  { value: "د.إ", label: "درهم إماراتي (د.إ)" },
  { value: "د.ك", label: "دينار كويتي (د.ك)" },
  { value: "ل.ل", label: "ليرة لبنانية (ل.ل)" },
  { value: "€", label: "يورو (€)" },
];
const CurrencyContext = React.createContext(DEFAULT_CURRENCY);

const fmt = (n) =>
  new Intl.NumberFormat("ar-JO", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(Math.abs(n));

const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

function nsKey(namespace, key) {
  return namespace ? `store:${namespace}:${key}` : key;
}

export default function App() {
  const [mode, setMode] = useState("personal"); // personal | stores
  const [stores, setStores] = useState(null); // null = loading
  const [activeStoreId, setActiveStoreId] = useState(null);
  const [showAddStore, setShowAddStore] = useState(false);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("currency");
        if (res && res.value) setCurrency(JSON.parse(res.value));
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await window.storage.set("currency", JSON.stringify(currency));
      } catch (e) {}
    })();
  }, [currency]);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("stores");
        const list = res && res.value ? JSON.parse(res.value) : [];
        setStores(list);
        if (list.length) setActiveStoreId(list[0].id);
      } catch (e) {
        setStores([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (stores === null) return;
    (async () => {
      try {
        await window.storage.set("stores", JSON.stringify(stores));
      } catch (e) {}
    })();
  }, [stores]);

  function addStore(name) {
    const store = { id: uid(), name: name.trim() };
    setStores((prev) => [...(prev || []), store]);
    setActiveStoreId(store.id);
  }

  async function deleteStore(id) {
    setStores((prev) => prev.filter((s) => s.id !== id));
    if (activeStoreId === id) setActiveStoreId(null);
    const keys = ["transactions", "reminders", "openingBalance", "incomeAdjustment", "expenseAdjustment"];
    for (const k of keys) {
      try {
        await window.storage.delete(nsKey(id, k));
      } catch (e) {}
    }
  }

 const activeStore = (stores || []).find((s) => s.id === activeStoreId);

  const ALL_KEYS = ["currency", "stores", "transactions", "reminders", "openingBalance", "incomeAdjustment", "expenseAdjustment"];

  async function doBackup() {
    const bundle = {};
    for (const s of stores || []) {
      for (const k of ["transactions", "reminders", "openingBalance", "incomeAdjustment", "expenseAdjustment"]) {
        try {
          const r = await window.storage.get(nsKey(s.id, k));
          if (r && r.value) bundle[nsKey(s.id, k)] = r.value;
        } catch (e) {}
      }
    }
    for (const k of ALL_KEYS) {
      try {
        const r = await window.storage.get(k);
        if (r && r.value) bundle[k] = r.value;
      } catch (e) {}
    }
    await backupData(bundle);
  }

  async function doRestore() {
    const bundle = await restoreData();
    if (!bundle) return false;
    for (const key in bundle) {
      try {
        await window.storage.set(key, bundle[key]);
      } catch (e) {}
    }
    window.location.reload();
    return true;
    }

  return (
    <CurrencyContext.Provider value={currency}>
    <div dir="rtl" lang="ar" data-theme={theme} style={styles.appShell}>
      <FontLoader />
      <div style={styles.stitchTop} /><header style={styles.appHeader}>
        <button style={styles.menuBtn} onClick={() => setShowSettings(true)} aria-label="الإعدادات">
          <Menu size={22} color="#12312A" />
        </button>
        <div style={styles.brand}>
          <div style={styles.brandMark}>
  <img src="logo.png" alt="دفتري" style={styles.brandMarkImg} />
</div>
          <div>
            <div style={styles.brandTitle}>دفتري</div>
            <div style={styles.brandSub}>محاسبتك اليومية، بلمسة قلم</div>
          </div>
        </div>
      </header>

      <div style={styles.tabSwitch}>
        <button
          onClick={() => setMode("personal")}
          style={{
            ...styles.tabBtn,
            background: mode === "personal" ? "#12312A" : "transparent",
            color: mode === "personal" ? "#F1F4F0" : "#5A6B5F",
          }}
        >
          <User size={16} />
          المصاريف الشخصية
        </button>
        <button
          onClick={() => setMode("stores")}
          style={{
            ...styles.tabBtn,
            background: mode === "stores" ? "#12312A" : "transparent",
            color: mode === "stores" ? "#F1F4F0" : "#5A6B5F",
          }}
        >
          <Store size={16} />
          المحلات
        </button>
      </div>

      {mode === "personal" && (
        <Ledger key="personal" namespace={null} title="المصاريف الشخصية" />
      )}

      {mode === "stores" && (
        <>
          <div style={styles.storeChipsRow}>
            {(stores || []).map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStoreId(s.id)}
                style={{
                  ...styles.storeChip,
                  background: activeStoreId === s.id ? "#12312A" : "#fff",
                  color: activeStoreId === s.id ? "#F1F4F0" : "#3F4F44",
                  borderColor: activeStoreId === s.id ? "#12312A" : "#E3E8E2",
                }}
              >
                {s.name}
              </button>
            ))}
            <button style={styles.addStoreChip} onClick={() => setShowAddStore(true)}>
              <Plus size={15} strokeWidth={2.5} />
              محل جديد
            </button>
          </div>

          {stores !== null && stores.length === 0 && (
            <div style={styles.emptyStoresBox}>
              <Store size={30} color="#B8A98E" />
              <div style={{ marginTop: 10, fontWeight: 700, color: "#12312A", fontSize: 16 }}>
                ما عندك محلات بعد
              </div>
              <div style={{ fontSize: 14, color: "#5A6B5F", marginTop: 4 }}>
                أضف محلك الأول لتبدأ تتبّع حساباته بشكل منفصل عن مصاريفك الشخصية
              </div>
              <button style={styles.addStoreBigBtn} onClick={() => setShowAddStore(true)}>
                <Plus size={16} strokeWidth={2.5} />
                إضافة محل
              </button>
            </div>
          )}

          {activeStore && (
            <>
              <div style={styles.activeStoreBar}>
                <span style={{ fontWeight: 700, color: "#12312A", fontSize: 15 }}>{activeStore.name}</span>
                <button style={styles.deleteStoreBtn} onClick={() => deleteStore(activeStore.id)}>
                  <Trash2 size={14} />
                  حذف المحل
                </button>
              </div>
              <Ledger key={activeStore.id} namespace={activeStore.id} title={activeStore.name} />
            </>
          )}
        </>
      )}

      {showAddStore && (
        <NameEditForm
          title="محل جديد"
          hint="اكتب اسم المحل. راح يكون له دفتر حسابات منفصل تمامًا عن مصاريفك الشخصية."
          label="اسم المحل"
          placeholder="مثال: بقالة الأمل"
          onClose={() => setShowAddStore(false)}
          onSubmit={(name) => {
            if (name.trim()) addStore(name);
            setShowAddStore(false);
          }}
        />
      )}

      {showSettings && (
        <SettingsPanel
          currency={currency}
          onChangeCurrency={setCurrency}
          theme={theme}
          onChangeTheme={setTheme}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
    </CurrencyContext.Provider>
  );
}function Ledger({ namespace, title }) {
  const currency = useContext(CurrencyContext);
  const [transactions, setTransactions] = useState(null);
  const [reminders, setReminders] = useState(null);
  const [openingBalance, setOpeningBalance] = useState(null);
  const [incomeAdjustment, setIncomeAdjustment] = useState(null);
  const [expenseAdjustment, setExpenseAdjustment] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("expense");
  const [editingTx, setEditingTx] = useState(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(nsKey(namespace, "transactions"));
        setTransactions(res && res.value ? JSON.parse(res.value) : namespace ? [] : seedData());
      } catch (e) {
        setTransactions(namespace ? [] : seedData());
      }
      try {
        const res2 = await window.storage.get(nsKey(namespace, "reminders"));
        setReminders(res2 && res2.value ? JSON.parse(res2.value) : namespace ? [] : seedReminders());
      } catch (e) {
        setReminders(namespace ? [] : seedReminders());
      }
      try {
        const res3 = await window.storage.get(nsKey(namespace, "openingBalance"));
        setOpeningBalance(res3 && res3.value ? JSON.parse(res3.value) : 0);
      } catch (e) {
        setOpeningBalance(0);
      }
      try {
        const res4 = await window.storage.get(nsKey(namespace, "incomeAdjustment"));
        setIncomeAdjustment(res4 && res4.value ? JSON.parse(res4.value) : 0);
      } catch (e) {
        setIncomeAdjustment(0);
      }
      try {
        const res5 = await window.storage.get(nsKey(namespace, "expenseAdjustment"));
        setExpenseAdjustment(res5 && res5.value ? JSON.parse(res5.value) : 0);
      } catch (e) {
        setExpenseAdjustment(0);
      } finally {
        setLoaded(true);
      }
    })();
  }, [namespace]);

  useEffect(() => {
    if (!loaded || transactions === null) return;
    (async () => {
      try {
        await window.storage.set(nsKey(namespace, "transactions"), JSON.stringify(transactions));
      } catch (e) {}
    })();
  }, [transactions, loaded, namespace]);

  useEffect(() => {
    if (!loaded || reminders === null) return;
    (async () => {
      try {
        await window.storage.set(nsKey(namespace, "reminders"), JSON.stringify(reminders));
      } catch (e) {}
    })();
  }, [reminders, loaded, namespace]);

  useEffect(() => {
    if (!loaded || openingBalance === null) return;
    (async () => {
      try {
        await window.storage.set(nsKey(namespace, "openingBalance"), JSON.stringify(openingBalance));
      } catch (e) {}
    })();
  }, [openingBalance, loaded, namespace]);

  useEffect(() => {
    if (!loaded || incomeAdjustment === null) return;
    (async () => {
      try {
        await window.storage.set(nsKey(namespace, "incomeAdjustment"), JSON.stringify(incomeAdjustment));
      } catch (e) {}
    })();
  }, [incomeAdjustment, loaded, namespace]);

  useEffect(() => {
    if (!loaded || expenseAdjustment === null) return;
    (async () => {
      try {
        await window.storage.set(nsKey(namespace, "expenseAdjustment"), JSON.stringify(expenseAdjustment));
      } catch (e) {}
    })();
  }, [expenseAdjustment, loaded, namespace]);

  function seedData() {
    const d = new Date();
    const iso = (offsetDays) => {
      const x = new Date(d);
      x.setDate(x.getDate() - offsetDays);
      return x.toISOString().slice(0, 10);
    };
    return [
      { id: uid(), type: "income", amount: 650, category: "راتب", note: "راتب الشهر", date: iso(28) },
      { id: uid(), type: "expense", amount: 220, category: "سكن", note: "إيجار", date: iso(27) },
      { id: uid(), type: "expense", amount: 45, category: "طعام", note: "بقالة الأسبوع", date: iso(20) },
      { id: uid(), type: "expense", amount: 25, category: "مواصلات", note: "بنزين", date: iso(15) },
      { id: uid(), type: "income", amount: 60, category: "مبيعات", note: "بيع أغراض مستعملة", date: iso(12) },
      { id: uid(), type: "expense", amount: 12, category: "ترفيه", note: "سينما", date: iso(8) },
      { id: uid(), type: "expense", amount: 38, category: "فواتير", note: "كهرباء وماء", date: iso(5) },
      { id: uid(), type: "expense", amount: 30, category: "تسوق", note: "ملابس", date: iso(2) },
    ];
  }

  function seedReminders() {
    return [
      { id: uid(), name: "إيجار الشقة", amount: 220, category: "سكن", dueDay: 1, lastPaidMonth: null },
      { id: uid(), name: "فاتورة الإنترنت", amount: 18, category: "فواتير", dueDay: 5, lastPaidMonth: null },
      { id: uid(), name: "اشتراك الجيم", amount: 25, category: "صحة", dueDay: 10, lastPaidMonth: null },
    ];
  }

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }function addTransaction(tx) {
    setTransactions((prev) => [{ ...tx, id: uid() }, ...(prev || [])]);
    showToast(tx.type === "income" ? "تم تسجيل الدخل" : "تم تسجيل المصروف");
  }

  function updateTransaction(id, tx) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...tx } : t)));
    showToast("تم حفظ التعديلات");
  }

  function deleteTransaction(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast("تم حذف القيد");
  }

  function addReminder(rem) {
    setReminders((prev) => [...(prev || []), { ...rem, id: uid(), lastPaidMonth: null }]);
    showToast("تمت إضافة التذكير");
  }

  function updateReminder(id, rem) {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...rem } : r)));
    showToast("تم حفظ التعديلات");
  }

  function deleteReminder(id) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    showToast("تم حذف التذكير");
  }

  function markReminderPaid(rem) {
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setReminders((prev) => prev.map((r) => (r.id === rem.id ? { ...r, lastPaidMonth: key } : r)));
    addTransaction({
      type: "expense",
      amount: rem.amount,
      category: rem.category,
      note: rem.name,
      date: todayISO(),
    });
  }

  const sorted = useMemo(
    () => [...(transactions || [])].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions]
  );

  const totals = useMemo(() => {
    let txIncome = 0, txExpense = 0;
    (transactions || []).forEach((t) => {
      if (t.type === "income") txIncome += Number(t.amount);
      else txExpense += Number(t.amount);
    });
    const income = txIncome + (incomeAdjustment || 0);
    const expense = txExpense + (expenseAdjustment || 0);
    return { income, expense, balance: (openingBalance || 0) + income - expense };
  }, [transactions, openingBalance, incomeAdjustment, expenseAdjustment]);

  function setBalance(desired) {
    const netFromTotals = totals.income - totals.expense;
    setOpeningBalance(desired - netFromTotals);
    showToast("تم تحديث الرصيد الحالي");
  }

  function setIncome(desired) {
    const txIncome = totals.income - (incomeAdjustment || 0);
    setIncomeAdjustment(desired - txIncome);
    showToast("تم تحديث إجمالي الدخل");
  }

  function setExpense(desired) {
    const txExpense = totals.expense - (expenseAdjustment || 0);
    setExpenseAdjustment(desired - txExpense);
    showToast("تم تحديث إجمالي المصروفات");
  }

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const monthTx = (key) => (transactions || []).filter((t) => t.date.slice(0, 7) === key);

  const thisMonthExpense = useMemo(
    () => monthTx(thisMonthKey).filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  );
  const lastMonthExpense = useMemo(
    () => monthTx(lastMonthKey).filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  );
  const thisMonthIncome = useMemo(
    () => monthTx(thisMonthKey).filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  );

  const categoryBreakdown = useMemo(() => {
    const map = {};
    (transactions || [])
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: catMeta(name).color }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const topCategory = categoryBreakdown[0];
  const momChange = lastMonthExpense > 0
    ? Math.round(((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100)
    : null;
  const savingsRate = thisMonthIncome > 0
    ? Math.round(((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100)
    : null;

  const weeklyBars = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayLabel = ["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"][d.getDay()];
      const exp = (transactions || []).filter((t) => t.date === key && t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0);
      days.push({ day: dayLabel, exp });
    }
    return days;
  }, [transactions]);

  const filtered = useMemo(() => {
    return sorted.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCat !== "all" && t.category !== filterCat) return false;
      if (search && !(`${t.note} ${t.category}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [sorted, filterType, filterCat, search]);const withRunning = useMemo(() => {
    const chronological = [...(transactions || [])].sort((a, b) => (a.date > b.date ? 1 : -1));
    const balanceAt = {};
    let running = 0;
    chronological.forEach((t) => {
      running += t.type === "income" ? Number(t.amount) : -Number(t.amount);
      balanceAt[t.id] = running;
    });
    return filtered.map((t) => ({ ...t, running: balanceAt[t.id] }));
  }, [filtered, transactions]);

  const reminderStatus = useMemo(() => {
    const list = (reminders || []).map((r) => {
      const paid = r.lastPaidMonth === thisMonthKey;
      const daysUntil = r.dueDay - now.getDate();
      let state = "upcoming";
      if (paid) state = "paid";
      else if (daysUntil < 0) state = "overdue";
      else if (daysUntil <= 5) state = "soon";
      return { ...r, paid, daysUntil, state };
    });
    const order = { overdue: 0, soon: 1, upcoming: 2, paid: 3 };
    list.sort((a, b) => order[a.state] - order[b.state] || a.daysUntil - b.daysUntil);
    return list;
  }, [reminders, thisMonthKey]);

  const urgentCount = reminderStatus.filter((r) => r.state === "overdue" || r.state === "soon").length;

  if (!loaded || transactions === null || reminders === null || openingBalance === null || incomeAdjustment === null || expenseAdjustment === null) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingMark}>
  <img src="logo.png" alt="دفتري" style={styles.loadingMarkImg} />
</div>
        <div style={{ fontFamily: "Tajawal, sans-serif", color: "#12312A", fontSize: 15 }}>
          جارِ فتح الدفتر…
        </div>
      </div>
    );
  }

  return (
    <div style={styles.ledgerRoot}>
      <div style={styles.ledgerToolbar}>
        <span style={styles.ledgerTitle}>{title}</span>
        <button style={styles.addBtn} onClick={() => { setEditingTx(null); setFormType("expense"); setShowForm(true); }}>
          <Plus size={18} strokeWidth={2.5} />
          قيد جديد
        </button>
      </div>

      <section style={styles.summaryGrid}>
        <SummaryCard label="الرصيد الحالي" value={totals.balance} icon={Wallet} tone="ink" editable onEdit={() => setShowBalanceForm(true)} />
        <SummaryCard label="إجمالي الدخل" value={totals.income} icon={TrendingUp} tone="income" editable onEdit={() => setShowIncomeForm(true)} />
        <SummaryCard label="إجمالي المصروفات" value={totals.expense} icon={TrendingDown} tone="expense" editable onEdit={() => setShowExpenseForm(true)} />
      </section>

      <section style={styles.insightCard}>
        <div style={styles.insightHead}>
          <Sparkles size={18} color="#C9A227" />
          <span>ملاحظات ذكية</span>
        </div>
        <div style={styles.insightBody}>
          {topCategory && (
            <span style={styles.insightChip}>
              أعلى إنفاق: <b>{topCategory.name}</b> ({fmt(topCategory.value)} {currency})
            </span>
          )}
          {momChange !== null && (
            <span style={styles.insightChip}>
              مصروفات هذا الشهر {momChange >= 0 ? "أعلى" : "أقل"} من الشهر الماضي بنسبة <b>{Math.abs(momChange)}٪</b>
            </span>
          )}
          {savingsRate !== null && (
            <span style={styles.insightChip}>معدّل الادخار هذا الشهر: <b>{savingsRate}٪</b> من الدخل</span>
          )}
          {!topCategory && momChange === null && savingsRate === null && (
            <span style={styles.insightChip}>أضف بعض القيود لتظهر لك الملاحظات هنا</span>
          )}
        </div>
      </section>

      {namespace && (
        <ItemsPanel namespace={namespace} currency={currency} onRecordSale={addTransaction} />
      )}

      <section style={styles.remindersCard}>
        <div style={styles.remindersHead}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={17} color="#12312A" />
            <span style={styles.remindersTitle}>الالتزامات الشهرية</span>
            {urgentCount > 0 && <span style={styles.urgentBadge}>{urgentCount}</span>}
          </div>
          <button style={styles.smallAddBtn} onClick={() => { setEditingReminder(null); setShowReminderForm(true); }}>
            <Plus size={14} strokeWidth={2.5} />
            تذكير
          </button>
        </div>

        {reminderStatus.length === 0 ? (
          <EmptyMini text="لا توجد التزامات شهرية مسجّلة بعد" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {reminderStatus.map((r) => {
              const meta = catMeta(r.category);
              const Icon = meta.icon;
              const badge = {
                overdue: { text: "متأخر", bg: "#A6462E1A", fg: "#A6462E" },
                soon: { text: r.daysUntil === 0 ? "مستحق اليوم" : `بعد ${r.daysUntil} يوم`, bg: "#C9A2271A", fg: "#8A6C15" },
                upcoming: { text: `يوم ${r.dueDay} من الشهر`, bg: "#EDF1EA", fg: "#5A6B5F" },
                paid: { text: "تم الدفع", bg: "#2F6F4E1A", fg: "#2F6F4E" },
              }[r.state];
              return (
                <div key={r.id} style={styles.reminderRow} onClick={() => { setEditingReminder(r); setShowReminderForm(true); }}>
                  <span style={{ ...styles.catIcon, background: meta.color + "22", color: meta.color }}>
                    <Icon size={16} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.rowNote}>{r.name}</div>
                    <div style={{ fontSize: 13, color: "#8A968D" }}>{r.category}</div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums", color: "#12312A" }}>
                    {fmt(r.amount)} {currency}
                  </span>
                  <span style={{ ...styles.statusBadge, background: badge.bg, color: badge.fg }}>
                    {r.state === "paid" && <CheckCircle2 size={13} />}
                    {r.state === "overdue" && <AlertTriangle size={13} />}
                    {badge.text}
                  </span>
                  {r.state !== "paid" && (
                    <button style={styles.payBtn} onClick={(e) => { e.stopPropagation(); markReminderPaid(r); }}>
                      تسجيل الدفع
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteReminder(r.id); }}
                    style={styles.deleteBtn}
                    aria-label="حذف التذكير"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section><section style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>توزيع المصروفات حسب الفئة</div>
          {categoryBreakdown.length ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 150, height: 150, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={2} stroke="none">
                      {categoryBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(v, n) => [`${fmt(v)} ${currency}`, n]}
                      contentStyle={{ fontFamily: "Tajawal, sans-serif", direction: "rtl", borderRadius: 8, border: "1px solid #E3E8E2", fontSize: 14 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                {categoryBreakdown.slice(0, 5).map((c) => (
                  <div key={c.name} style={styles.legendRow}>
                    <span style={{ ...styles.legendDot, background: c.color }} />
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span style={{ color: "#5A6B5F", fontVariantNumeric: "tabular-nums" }}>{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyMini text="لا توجد مصروفات بعد" />
          )}
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>مصروفات آخر ٧ أيام</div>
          <div style={{ width: "100%", height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBars} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E8E2" vertical={false} />
                <XAxis dataKey="day" tick={{ fontFamily: "Tajawal, sans-serif", fontSize: 12, fill: "#5A6B5F" }} axisLine={{ stroke: "#D8DED6" }} tickLine={false} />
                <YAxis tick={{ fontFamily: "Tajawal, sans-serif", fontSize: 11, fill: "#5A6B5F" }} axisLine={false} tickLine={false} />
                <ReTooltip
                  formatter={(v) => [`${fmt(v)} ${currency}`, "مصروف"]}
                  contentStyle={{ fontFamily: "Tajawal, sans-serif", direction: "rtl", borderRadius: 8, border: "1px solid #E3E8E2", fontSize: 14 }}
                  cursor={{ fill: "#F1F4F0" }}
                />
                <Bar dataKey="exp" radius={[6, 6, 0, 0]} fill="#A6462E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section style={styles.controls}>
        <div style={styles.searchBox}>
          <Search size={17} color="#5A6B5F" />
          <input placeholder="ابحث في القيود…" value={search} onChange={(e) => setSearch(e.target.value)} style={styles.searchInput} />
        </div>
        <Dropdown
          value={filterType}
          onChange={(v) => { setFilterType(v); setFilterCat("all"); }}
          options={[
            { value: "all", label: "كل الأنواع" },
            { value: "income", label: "دخل" },
            { value: "expense", label: "مصروف" },
          ]}
        />
        <Dropdown
          value={filterCat}
          onChange={setFilterCat}
          options={[
            { value: "all", label: "كل الفئات" },
            ...(filterType === "income" ? INCOME_CATS : filterType === "expense" ? EXPENSE_CATS : ALL_CATS)
              .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
              .map((c) => ({ value: c.id, label: c.id })),
          ]}
        />
      </section>

      <section style={styles.ledgerCard}>
        <div style={styles.ledgerHeaderRow}>
          <span style={{ flex: "0 0 36px" }} />
          <span style={{ flex: 2 }}>البيان</span>
          <span style={{ flex: 1 }}>الفئة</span>
          <span style={{ flex: 1 }}>التاريخ</span>
          <span style={{ flex: 1, textAlign: "left" }}>المبلغ</span>
          <span style={{ flex: 1, textAlign: "left" }}>الرصيد</span>
          <span style={{ flex: "0 0 34px" }} />
        </div>
        <div style={styles.ledgerRule} />

        {withRunning.length === 0 ? (
          <EmptyMini text="لا توجد قيود مطابقة" tall />
        ) : (
          withRunning.map((t) => {
            const meta = catMeta(t.category);
            const Icon = meta.icon;
            return (
              <div key={t.id} style={styles.ledgerRow} onClick={() => { setEditingTx(t); setFormType(t.type); setShowForm(true); }}>
                <span style={{ flex: "0 0 36px" }}>
                  <span style={{ ...styles.catIcon, background: meta.color + "22", color: meta.color }}>
                    <Icon size={16} />
                  </span>
                </span>
                <span style={{ flex: 2, minWidth: 0 }}>
                  <div style={styles.rowNote}>{t.note || "بدون بيان"}</div>
                </span>
                <span style={{ flex: 1, color: "#5A6B5F", fontSize: 14 }}>{t.category}</span>
                <span style={{ flex: 1, color: "#5A6B5F", fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{t.date}</span>
                <span style={{ flex: 1, textAlign: "left", fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums", color: t.type === "income" ? "#2F6F4E" : "#A6462E" }}>
                  {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
                </span>
                <span style={{ flex: 1, textAlign: "left", fontSize: 14, fontVariantNumeric: "tabular-nums", color: "#12312A" }}>{fmt(t.running)}</span>
                <span style={{ flex: "0 0 34px", textAlign: "left" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTransaction(t.id); }}
                    style={styles.deleteBtn}
                    aria-label="حذف القيد"
                    title="حذف"
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            );
          })
        )}
      </section>{showForm && (
        <TransactionForm
          type={formType}
          setType={setFormType}
          initial={editingTx}
          onClose={() => { setShowForm(false); setEditingTx(null); }}
          onDelete={editingTx ? () => { deleteTransaction(editingTx.id); setShowForm(false); setEditingTx(null); } : null}
          onSubmit={(tx) => {
            if (editingTx) updateTransaction(editingTx.id, tx);
            else addTransaction(tx);
            setShowForm(false);
            setEditingTx(null);
          }}
        />
      )}

      {showReminderForm && (
        <ReminderForm
          initial={editingReminder}
          onClose={() => { setShowReminderForm(false); setEditingReminder(null); }}
          onDelete={editingReminder ? () => { deleteReminder(editingReminder.id); setShowReminderForm(false); setEditingReminder(null); } : null}
          onSubmit={(rem) => {
            if (editingReminder) updateReminder(editingReminder.id, rem);
            else addReminder(rem);
            setShowReminderForm(false);
            setEditingReminder(null);
          }}
        />
      )}

      {showBalanceForm && (
        <AmountEditForm
          title="تعديل الرصيد الحالي"
          hint="اكتب رصيدك الفعلي الآن. سيتم ضبط النقطة المرجعية للدفتر تلقائيًا بحيث يطابق حساب الدخل والمصروفات هذا الرقم، دون التأثير على القيود المسجّلة."
          current={totals.balance}
          onClose={() => setShowBalanceForm(false)}
          onSubmit={(val) => { setBalance(val); setShowBalanceForm(false); }}
        />
      )}

      {showIncomeForm && (
        <AmountEditForm
          title="تعديل إجمالي الدخل"
          hint="اكتب إجمالي الدخل الصحيح. سيتم إضافة فرق تسوية تلقائيًا ليطابق مجموع القيود هذا الرقم، والرصيد الحالي سيتحدّث معه."
          current={totals.income}
          onClose={() => setShowIncomeForm(false)}
          onSubmit={(val) => { setIncome(val); setShowIncomeForm(false); }}
        />
      )}

      {showExpenseForm && (
        <AmountEditForm
          title="تعديل إجمالي المصروفات"
          hint="اكتب إجمالي المصروفات الصحيح. سيتم إضافة فرق تسوية تلقائيًا ليطابق مجموع القيود هذا الرقم، والرصيد الحالي سيتحدّث معه."
          current={totals.expense}
          onClose={() => setShowExpenseForm(false)}
          onSubmit={(val) => { setExpense(val); setShowExpenseForm(false); }}
        />
      )}

      
{toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

function ItemsPanel({ namespace, currency, onRecordSale }) {
  const [items, setItems] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleItem, setSaleItem] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(nsKey(namespace, "items"));
        setItems(res && res.value ? JSON.parse(res.value) : []);
      } catch (e) {
        setItems([]);
      } finally {
        setLoaded(true);
      }
    })();
  }, [namespace]);

  useEffect(() => {
    if (!loaded || items === null) return;
    (async () => {
      try {
        await window.storage.set(nsKey(namespace, "items"), JSON.stringify(items));
      } catch (e) {}
    })();
  }, [items, loaded, namespace]);

  function addItem(item) {
    setItems((prev) => [
      { ...item, id: uid(), remainingQty: item.originalQty },
      ...(prev || []),
    ]);
  }

  function updateItem(id, item) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...item } : it)));
  }

  function deleteItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function recordSale(item, qty) {
    const n = Number(qty);
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, remainingQty: Math.max(0, it.remainingQty - n) } : it
      )
    );
    onRecordSale({
      type: "income",
      amount: item.price * n,
      category: "مبيعات",
      note: `بيع: ${item.name} (${n})`,
      date: todayISO(),
    });
  }

  if (!loaded || items === null) return null;
return (
    <section style={styles.itemsCard}>
      <div style={styles.itemsHead}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={19} color="#12312A" />
          <span style={styles.itemsTitle}>الأصناف والمخزون</span>
        </div>
        <button style={styles.smallAddBtn} onClick={() => { setEditingItem(null); setShowItemForm(true); }}>
          <Plus size={16} strokeWidth={2.5} />
          صنف جديد
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyMini text="لا توجد أصناف مسجّلة بعد. أضف أول صنف لتتبع مبيعاتك ومخزونك." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          {items.map((it) => {
            const lowStock = it.remainingQty <= 5;
            const hasCost = it.cost !== undefined && it.cost !== null && it.cost !== "";
            const profitPerUnit = hasCost ? it.price - Number(it.cost) : null;
            const marginPct = hasCost && it.price > 0 ? Math.round((profitPerUnit / it.price) * 100) : null;
            return (
              <div key={it.id} style={styles.itemCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.itemName}>{it.name}</div>
                    <div style={styles.itemPriceRow}>
                      {fmt(it.price)} {currency} / قطعة
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditingItem(it); setShowItemForm(true); }}
                    style={styles.deleteBtn}
                    aria-label="تعديل الصنف"
                  >
                    <Menu size={16} />
                  </button>
                </div>

                <div style={styles.itemStatsRow}>
                  <div style={styles.itemStatBox}>
                    <div style={styles.itemStatLabel}>الكمية الأصلية</div>
                    <div style={styles.itemStatValue}>{it.originalQty}</div>
                  </div>
                  <div style={styles.itemStatBox}>
                    <div style={styles.itemStatLabel}>المباع</div>
                    <div style={styles.itemStatValue}>{it.originalQty - it.remainingQty}</div>
                  </div>
                  <div style={{ ...styles.itemStatBox, background: lowStock ? "#A6462E14" : "#EDF1EA" }}>
                    <div style={styles.itemStatLabel}>المتبقي</div>
                    <div style={{ ...styles.itemStatValue, color: lowStock ? "#A6462E" : "#12312A" }}>
                      {it.remainingQty}
                    </div>
                  </div>
                </div>

                {lowStock && (
                  <div style={styles.lowStockBadge}>
                    <AlertTriangle size={15} />
                    الكمية قاربت على النفاد
                  </div>
                )}

                {hasCost && (
                  <div style={styles.profitBox}>
                    <span>هامش الربح للقطعة: <b>{fmt(profitPerUnit)} {currency}</b></span>
                    <span style={styles.profitPct}>{marginPct}٪</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    style={styles.sellBtn}
                    disabled={it.remainingQty <= 0}
                    onClick={() => { setSaleItem(it); setShowSaleForm(true); }}
                  >
                    تسجيل عملية بيع
                  </button>
                  <button
                    onClick={() => deleteItem(it.id)}
                    style={styles.deleteBtn}
                    aria-label="حذف الصنف"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showItemForm && (
        <ItemForm
          initial={editingItem}
          currency={currency}
          onClose={() => { setShowItemForm(false); setEditingItem(null); }}
          onDelete={editingItem ? () => { deleteItem(editingItem.id); setShowItemForm(false); setEditingItem(null); } : null}
          onSubmit={(item) => {
            if (editingItem) updateItem(editingItem.id, item);
            else addItem(item);
            setShowItemForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {showSaleForm && saleItem && (
        <SaleForm
          item={saleItem}
          currency={currency}
          onClose={() => { setShowSaleForm(false); setSaleItem(null); }}
          onSubmit={(qty) => {
            recordSale(saleItem, qty);
            setShowSaleForm(false);
            setSaleItem(null);
          }}
        />
      )}
    </section>
  );
}

function ItemForm({ initial, currency, onClose, onSubmit, onDelete }) {
  const [name, setName] = useState(initial ? initial.name : "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [cost, setCost] = useState(initial && initial.cost !== undefined ? String(initial.cost) : "");
  const [originalQty, setOriginalQty] = useState(initial ? String(initial.originalQty) : "");
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim()) { setError("اكتب اسم الصنف"); return; }
    const p = parseFloat(price);
    if (!price || isNaN(p) || p <= 0) { setError("أدخل سعر بيع صحيح أكبر من صفر"); return; }
    const q = parseInt(originalQty, 10);
    if (!originalQty || isNaN(q) || q < 0) { setError("أدخل كمية صحيحة"); return; }
    const c = cost === "" ? undefined : parseFloat(cost);
    if (cost !== "" && (isNaN(c) || c < 0)) { setError("سعر التكلفة غير صحيح"); return; }
    onSubmit({
      name: name.trim(),
      price: p,
      cost: c,
      originalQty: q,
    });
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} dir="rtl">
        <div style={styles.modalHead}>
          <span style={{ fontWeight: 800, fontSize: 19, color: "#12312A" }}>{initial ? "تعديل الصنف" : "صنف جديد"}</span>
          <button onClick={onClose} style={styles.closeBtn}><X size={19} /></button>
        </div>

        <label style={styles.bigLabel}>اسم الصنف</label>
        <input type="text" placeholder="مثال: قميص قطن أزرق" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} style={styles.bigInput} autoFocus />

        <label style={styles.bigLabel}>سعر البيع ({currency})</label>
        <input type="number" inputMode="decimal" placeholder="0.00" value={price} onChange={(e) => { setPrice(e.target.value); setError(""); }} style={styles.bigInput} />

        <label style={styles.bigLabel}>سعر التكلفة ({currency}) — اختياري، لحساب هامش الربح</label>
        <input type="number" inputMode="decimal" placeholder="0.00" value={cost} onChange={(e) => { setCost(e.target.value); setError(""); }} style={styles.bigInput} />

        <label style={styles.bigLabel}>الكمية الأصلية</label>
        <input type="number" inputMode="numeric" placeholder="0" value={originalQty} onChange={(e) => { setOriginalQty(e.target.value); setError(""); }} style={styles.bigInput} disabled={!!initial} />
        {initial && <div style={{ fontSize: 13, color: "#8A968D", marginTop: -8, marginBottom: 8 }}>لا يمكن تعديل الكمية الأصلية بعد إنشاء الصنف</div>}

        {error && <div style={styles.errorText}>{error}</div>}

        <button style={styles.submitBtn} onClick={submit}>{initial ? "حفظ التعديلات" : "إضافة الصنف"}</button>
        {onDelete && (
          <button style={styles.deleteFullBtn} onClick={onDelete}>
            <Trash2 size={15} />
            حذف هذا الصنف
          </button>
        )}
      </div>
    </div>
  );
}

function SaleForm({ item, currency, onClose, onSubmit }) {
  const [qty, setQty] = useState("1");
  const [error, setError] = useState("");

  function submit() {
    const n = parseInt(qty, 10);
    if (!qty || isNaN(n) || n <= 0) { setError("أدخل كمية صحيحة أكبر من صفر"); return; }
    if (n > item.remainingQty) { setError(`الكمية المتوفرة فقط ${item.remainingQty}`); return; }
    onSubmit(n);
  }

  const total = item.price * (parseInt(qty, 10) || 0);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} dir="rtl">
        <div style={styles.modalHead}>
          <span style={{ fontWeight: 800, fontSize: 19, color: "#12312A" }}>تسجيل عملية بيع</span>
          <button onClick={onClose} style={styles.closeBtn}><X size={19} /></button>
        </div>

        <div style={{ fontSize: 17, fontWeight: 700, color: "#12312A", marginBottom: 4 }}>{item.name}</div>
        <div style={{ fontSize: 14.5, color: "#5A6B5F", marginBottom: 14 }}>المتوفر حالياً: {item.remainingQty} قطعة</div>

        <label style={styles.bigLabel}>الكمية المباعة</label>
        <input type="number" inputMode="numeric" value={qty} onChange={(e) => { setQty(e.target.value); setError(""); }} style={styles.bigInput} autoFocus />

        <div style={styles.saleTotalBox}>
          الإجمالي: <b>{fmt(total)} {currency}</b>
        </div>

        {error && <div style={styles.errorText}>{error}</div>}

        <button style={styles.submitBtn} onClick={submit}>تأكيد عملية البيع</button>
      </div>
    </div>
  );
      }
function SummaryCard({ label, value, icon: Icon, tone, editable, onEdit }) {
  const currency = useContext(CurrencyContext);
  const toneStyles = {
    ink: { bg: "#12312A", fg: "#F1F4F0", accent: "#C9A227" },
    income: { bg: "#FFFFFF", fg: "#2F6F4E", accent: "#2F6F4E" },
    expense: { bg: "#FFFFFF", fg: "#A6462E", accent: "#A6462E" },
  }[tone];
  return (
    <div
      style={{
        ...styles.summaryCard,
        background: toneStyles.bg,
        color: toneStyles.bg === "#FFFFFF" ? "#12312A" : toneStyles.fg,
        cursor: editable ? "pointer" : "default",
      }}
      onClick={editable ? onEdit : undefined}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={editable ? (e) => { if (e.key === "Enter") onEdit(); } : undefined}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 14, opacity: 0.85 }}>{label}</span>
        <Icon size={17} color={toneStyles.accent} />
      </div>
      <div style={{ fontSize: 27, fontWeight: 800, marginTop: 8, fontVariantNumeric: "tabular-nums", color: toneStyles.bg === "#FFFFFF" ? toneStyles.fg : "#F1F4F0" }}>
        {fmt(value)} <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.7 }}>{currency}</span>
      </div>
      {editable && <span style={{ fontSize: 12, opacity: 0.65, marginTop: 4, display: "block" }}>اضغط للتعديل</span>}
    </div>
  );
}

function EmptyMini({ text, tall }) {
  return (
    <div style={{ padding: tall ? "36px 12px" : "20px 12px", textAlign: "center", color: "#8A968D", fontSize: 14.5 }}>
      {text}
    </div>
  );
}

function Dropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={styles.dropdownBtn}>
        <span>{selected ? selected.label : ""}</span>
        <ChevronDown size={16} color="#5A6B5F" />
      </button>
      {open && (
        <>
          <div style={styles.dropdownBackdrop} onClick={() => setOpen(false)} />
          <div style={styles.dropdownMenu}>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  ...styles.dropdownItem,
                  fontWeight: o.value === value ? 700 : 500,
                  color: o.value === value ? "#12312A" : "#3F4F44",
                  background: o.value === value ? "#F1F4F0" : "transparent",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TransactionForm({ type, setType, initial, onClose, onSubmit, onDelete }) {
  const currency = useContext(CurrencyContext);
  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial ? initial.category : cats[0].id);
  const [note, setNote] = useState(initial ? initial.note || "" : "");
  const [date, setDate] = useState(initial ? initial.date : todayISO());
  const [error, setError] = useState("");useEffect(() => {
    if (!initial) setCategory((type === "income" ? INCOME_CATS : EXPENSE_CATS)[0].id);
  }, [type]);

  function submit() {
    const n = parseFloat(amount);
    if (!amount || isNaN(n) || n <= 0) { setError("أدخل مبلغًا صحيحًا أكبر من صفر"); return; }
    if (!date) { setError("اختر تاريخًا للقيد"); return; }
    onSubmit({ type, amount: n, category, note: note.trim(), date });
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} dir="rtl">
        <div style={styles.modalHead}>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#12312A" }}>{initial ? "تعديل القيد" : "قيد جديد"}</span>
          <button onClick={onClose} style={styles.closeBtn}><X size={19} /></button>
        </div>

        <div style={styles.typeToggle}>
          <button onClick={() => setType("expense")} style={{ ...styles.typeBtn, background: type === "expense" ? "#A6462E" : "transparent", color: type === "expense" ? "#fff" : "#5A6B5F" }}>مصروف</button>
          <button onClick={() => setType("income")} style={{ ...styles.typeBtn, background: type === "income" ? "#2F6F4E" : "transparent", color: type === "income" ? "#fff" : "#5A6B5F" }}>دخل</button>
        </div>

        <label style={styles.label}>المبلغ ({currency})</label>
        <input type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} style={styles.input} autoFocus />

        <label style={styles.label}>الفئة</label>
        <div style={styles.catGrid}>
          {cats.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{ ...styles.catBtn, borderColor: active ? c.color : "#E3E8E2", background: active ? c.color + "1A" : "#fff", color: active ? c.color : "#5A6B5F" }}>
                <Icon size={17} />
                <span style={{ fontSize: 13 }}>{c.id}</span>
              </button>
            );
          })}
        </div>

        <label style={styles.label}>بيان (اختياري)</label>
        <input type="text" placeholder="مثال: فاتورة الإنترنت" value={note} onChange={(e) => setNote(e.target.value)} style={styles.input} />

        <label style={styles.label}>التاريخ</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />

        {error && <div style={styles.errorText}>{error}</div>}

        <button style={styles.submitBtn} onClick={submit}>{initial ? "حفظ التعديلات" : "حفظ القيد"}</button>
        {onDelete && (
          <button style={styles.deleteFullBtn} onClick={onDelete}>
            <Trash2 size={15} />
            حذف هذا القيد
          </button>
        )}
      </div>
    </div>
  );
}

function ReminderForm({ initial, onClose, onSubmit, onDelete }) {
  const currency = useContext(CurrencyContext);
  const [name, setName] = useState(initial ? initial.name : "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial ? initial.category : EXPENSE_CATS[0].id);
  const [dueDay, setDueDay] = useState(initial ? initial.dueDay : 1);
  const [error, setError] = useState("");

  function submit() {
    const n = parseFloat(amount);
    if (!name.trim()) { setError("اكتب اسم الالتزام (مثال: إيجار)"); return; }
    if (!amount || isNaN(n) || n <= 0) { setError("أدخل مبلغًا صحيحًا أكبر من صفر"); return; }
    const day = parseInt(dueDay, 10);
    if (!day || day < 1 || day > 31) { setError("اختر يومًا من الشهر بين ١ و٣١"); return; }
    onSubmit({ name: name.trim(), amount: n, category, dueDay: day });
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} dir="rtl">
        <div style={styles.modalHead}>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#12312A" }}>{initial ? "تعديل الالتزام" : "تذكير مصروف شهري"}</span>
          <button onClick={onClose} style={styles.closeBtn}><X size={19} /></button>
        </div>

        <label style={styles.label}>اسم الالتزام</label>
        <input type="text" placeholder="مثال: إيجار الشقة، اشتراك الإنترنت" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} style={styles.input} autoFocus />

        <label style={styles.label}>المبلغ ({currency})</label>
        <input type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} style={styles.input} />

        <label style={styles.label}>الفئة</label>
        <div style={styles.catGrid}>
          {EXPENSE_CATS.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{ ...styles.catBtn, borderColor: active ? c.color : "#E3E8E2", background: active ? c.color + "1A" : "#fff", color: active ? c.color : "#5A6B5F" }}>
                <Icon size={17} />
                <span style={{ fontSize: 13 }}>{c.id}</span>
              </button>
            );
          })}
        </div>

        <label style={styles.label}>يتكرر كل شهر في اليوم</label>
        <input type="number" min={1} max={31} value={dueDay} onChange={(e) => { setDueDay(e.target.value); setError(""); }} style={styles.input} />

        {error && <div style={styles.errorText}>{error}</div>}

        <button style={styles.submitBtn} onClick={submit}>{initial ? "حفظ التعديلات" : "حفظ التذكير"}</button>
        {onDelete && (
          <button style={styles.deleteFullBtn} onClick={onDelete}>
            <Trash2 size={15} />
            حذف هذا الالتزام
          </button>
        )}
      </div>
    </div>
  );
}

function AmountEditForm({ title, hint, current, onClose, onSubmit }) {
  const currency = useContext(CurrencyContext);
  const [value, setValue] = useState(String(Math.round(current * 100) / 100));
  const [error, setError] = useState("");

  function submit() {
    const n = parseFloat(value);
    if (value === "" || isNaN(n)) { setError("أدخل رقمًا صحيحًا"); return; }
    onSubmit(n);
  }return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} dir="rtl">
        <div style={styles.modalHead}>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#12312A" }}>{title}</span>
          <button onClick={onClose} style={styles.closeBtn}><X size={19} /></button>
        </div>
        <p style={{ fontSize: 13.5, color: "#5A6B5F", margin: "0 2px 14px", lineHeight: 1.75 }}>{hint}</p>
        <label style={styles.label}>القيمة ({currency})</label>
        <input type="number" inputMode="decimal" step="0.01" value={value} onChange={(e) => { setValue(e.target.value); setError(""); }} style={styles.input} autoFocus />
        {error && <div style={styles.errorText}>{error}</div>}
        <button style={styles.submitBtn} onClick={submit}>حفظ</button>
      </div>
    </div>
  );
}

function NameEditForm({ title, hint, label, placeholder, onClose, onSubmit }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!value.trim()) { setError("اكتب اسمًا صحيحًا"); return; }
    onSubmit(value);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} dir="rtl">
        <div style={styles.modalHead}>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#12312A" }}>{title}</span>
          <button onClick={onClose} style={styles.closeBtn}><X size={19} /></button>
        </div>
        {hint && <p style={{ fontSize: 13.5, color: "#5A6B5F", margin: "0 2px 14px", lineHeight: 1.75 }}>{hint}</p>}
        <label style={styles.label}>{label}</label>
        <input type="text" placeholder={placeholder} value={value} onChange={(e) => { setValue(e.target.value); setError(""); }} style={styles.input} autoFocus />
        {error && <div style={styles.errorText}>{error}</div>}
        <button style={styles.submitBtn} onClick={submit}>حفظ</button>
      </div>
    </div>
  );
}

function SettingsPanel({ currency, onChangeCurrency, theme, onChangeTheme, onClose }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleBackup() {
    setBusy(true);
    setMsg("");
    try {
      await backupData({});
      setMsg("تم رفع النسخة الاحتياطية بنجاح");
    } catch (e) {
      setMsg("حدث خطأ أثناء النسخ الاحتياطي");
    }
    setBusy(false);
  }

  async function handleRestore() {
    setBusy(true);
    setMsg("");
    try {
      const ok = await restoreData();
      if (!ok) setMsg("لا توجد نسخة احتياطية محفوظة");
    } catch (e) {
      setMsg("حدث خطأ أثناء الاستعادة");
    }
    setBusy(false);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} dir="rtl">
        <div style={styles.modalHead}>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#12312A" }}>الإعدادات</span>
          <button onClick={onClose} style={styles.closeBtn}><X size={19} /></button>
        </div>

        <label style={styles.label}>العملة</label>
        <Dropdown value={currency} onChange={onChangeCurrency} options={CURRENCY_OPTIONS} />

        <label style={{ ...styles.label, marginTop: 22 }}>النسخ الاحتياطي</label>
        <button style={styles.submitBtn} onClick={handleBackup} disabled={busy}>
          {busy ? "جارٍ التنفيذ..." : "رفع نسخة احتياطية الآن"}
        </button>
        <button style={{ ...styles.submitBtn, marginTop: 10, background: "#5A6B5F" }} onClick={handleRestore} disabled={busy}>
          استعادة آخر نسخة احتياطية
        </button>
        {msg && <div style={{ fontSize: 13.5, color: "#5A6B5F", marginTop: 8, textAlign: "center" }}>{msg}</div>}
        <label style={{ ...styles.label, marginTop: 22 }}>المظهر</label>
        <div style={styles.typeToggle}>
          <button onClick={() => onChangeTheme("light")} style={{ ...styles.typeBtn, background: theme === "light" ? "#12312A" : "transparent", color: theme === "light" ? "#fff" : "#5A6B5F" }}>فاتح</button>
          <button onClick={() => onChangeTheme("dark")} style={{ ...styles.typeBtn, background: theme === "dark" ? "#12312A" : "transparent", color: theme === "dark" ? "#fff" : "#5A6B5F" }}>داكن</button>
        </div>

        <button style={styles.submitBtn} onClick={onClose}>تم</button>
      </div>
    </div>
  );
}

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&family=Tajawal:wght@400;500;700&display=swap');
      * { box-sizing: border-box; }
      html, body { overscroll-behavior-x: none; background: var(--bg); }
      [data-theme="light"] { --bg: #F1F4F0; --card: #FFFFFF; --text: #12312A; --text-2: #5A6B5F; --border: #E3E8E2; --input-bg: #FFFFFF; --modal-bg: #F7F9F6; }
      [data-theme="dark"] { --bg: #0F1712; --card: #182620; --text: #E9EFE9; --text-2: #93A399; --border: #2A3830; --input-bg: #182620; --modal-bg: #142019; }}
      input:focus, select:focus, button:focus-visible {
        outline: 2px solid #C9A227;
        outline-offset: 1px;
      }
      input::placeholder { color: #A3AEA0; }
      @media (prefers-reduced-motion: reduce) {
        * { transition: none !important; animation: none !important; }
      }
    `}</style>
  );
}

const styles = {
  appShell: {
    fontFamily: "Tajawal, sans-serif",
    background: "var(--bg)",
    minHeight: "100vh",
    color: "var(--text)",
    maxWidth: 760,
    margin: "0 auto",
    position: "relative",
    touchAction: "pan-y",
    overscrollBehaviorX: "none",
  },
  loadingScreen: {
    minHeight: "60vh",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
  },
  loadingMark: {
    width: 48, height: 48, borderRadius: "50%",
    background: "#12312A",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
},
loadingMarkImg: { width: "100%", height: "100%", objectFit: "cover" },
  stitchTop: {
    height: 6,
    backgroundImage: "repeating-linear-gradient(90deg, #C9A227 0 10px, transparent 10px 20px)",
    opacity: 0.55,
  },
  appHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 8px" },
  menuBtn: {
    border: "1px solid #E3E8E2", background: "#fff", borderRadius: 10,
    padding: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  brandMark: {
    width: 42, height: 42, borderRadius: 12,
    background: "#12312A",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", flexShrink: 0,
},
brandMarkImg: { width: "100%", height: "100%", objectFit: "cover" },
  brandTitle: { fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: 21, lineHeight: 1.2 },
  brandSub: { fontSize: 13.5, color: "#5A6B5F", marginTop: 1 },

  tabSwitch: {
    display: "flex", gap: 8, margin: "10px 20px 4px",
    background: "#E7ECE5", borderRadius: 12, padding: 4,
  },
  tabBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    border: "none", borderRadius: 9, padding: "10px 6px",
    fontFamily: "Tajawal, sans-serif", fontWeight: 700, fontSize: 14.5, cursor: "pointer",
  },storeChipsRow: { display: "flex", gap: 8, flexWrap: "wrap", padding: "14px 20px 0" },
  storeChip: {
    border: "1.5px solid #E3E8E2", borderRadius: 20, padding: "8px 16px",
    fontFamily: "Tajawal, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  addStoreChip: {
    display: "flex", alignItems: "center", gap: 5,
    border: "1.5px dashed #B8A98E", borderRadius: 20, padding: "8px 16px",
    background: "transparent", color: "#8A6C15",
    fontFamily: "Tajawal, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  emptyStoresBox: {
    margin: "24px 20px 0", background: "#fff", border: "1px dashed #E3E8E2",
    borderRadius: 16, padding: "36px 20px", textAlign: "center",
  },
  addStoreBigBtn: {
    marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6,
    background: "#12312A", color: "#F1F4F0", border: "none", borderRadius: 10,
    padding: "11px 20px", fontFamily: "Tajawal, sans-serif", fontWeight: 700, fontSize: 14.5, cursor: "pointer",
  },
  activeStoreBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    margin: "16px 20px 0", padding: "10px 14px",
    background: "#fff", border: "1px solid #E3E8E2", borderRadius: 10,
  },
  deleteStoreBtn: {
    display: "flex", alignItems: "center", gap: 5,
    border: "none", background: "transparent", color: "#A6462E",
    fontFamily: "Tajawal, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer",
  },

  ledgerRoot: { paddingBottom: 40 },
  ledgerToolbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px 0",
  },
  ledgerTitle: { fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: 17, color: "#12312A" },
  addBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#C9A227", color: "#12312A",
    border: "none", borderRadius: 10,
    padding: "10px 16px", fontFamily: "Tajawal, sans-serif",
    fontWeight: 700, fontSize: 14.5, cursor: "pointer",
    boxShadow: "0 2px 0 #A9861C",
  },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "12px 20px 0" },
  summaryCard: { borderRadius: 14, padding: "14px 16px", border: "1px solid #E3E8E2" },
  insightCard: {
    margin: "16px 20px 0", background: "#fff", border: "1px solid #E3E8E2",
    borderRight: "3px solid #C9A227", borderRadius: 12, padding: "12px 16px",
  },
  insightHead: {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14.5, color: "#12312A", marginBottom: 8,
  },
  insightBody: { display: "flex", flexWrap: "wrap", gap: 8 },
  insightChip: { fontSize: 13.5, color: "#3F4F44", background: "#F1F4F0", borderRadius: 20, padding: "6px 13px" },

  remindersCard: {
    margin: "16px 20px 0", background: "#fff", border: "1px solid #E3E8E2",
    borderRight: "3px solid #12312A", borderRadius: 14, padding: "14px 16px",
  },
  remindersHead: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  remindersTitle: { fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 15, color: "#12312A" },
  urgentBadge: { background: "#A6462E", color: "#fff", fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "2px 9px", fontFamily: "Tajawal, sans-serif" },
  smallAddBtn: {
    display: "flex", alignItems: "center", gap: 4,
    background: "#F1F4F0", border: "1px solid #E3E8E2", color: "#12312A",
    borderRadius: 8, padding: "7px 12px", fontSize: 13.5, fontWeight: 700,
    fontFamily: "Tajawal, sans-serif", cursor: "pointer",
  },
  reminderRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 4px", borderBottom: "1px dashed #E9ECE8", flexWrap: "wrap", cursor: "pointer",
  },
  statusBadge: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "4px 10px",
    fontFamily: "Tajawal, sans-serif", whiteSpace: "nowrap",
  },
  payBtn: {
    border: "1px solid #2F6F4E", background: "#2F6F4E0F", color: "#2F6F4E",
    borderRadius: 8, padding: "6px 11px", fontSize: 12.5, fontWeight: 700,
    fontFamily: "Tajawal, sans-serif", cursor: "pointer", whiteSpace: "nowrap",
  },
  chartsGrid: { display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 12, padding: "16px 20px 0" },
  chartCard: { background: "#fff", border: "1px solid #E3E8E2", borderRadius: 14, padding: "14px 16px" },
  chartTitle: { fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14.5, marginBottom: 10, color: "#12312A" },
  legendRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 },
  legendDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  controls: { display: "flex", gap: 10, padding: "18px 20px 0", flexWrap: "wrap" },
  searchBox: {
    flex: "1 1 200px", display: "flex", alignItems: "center", gap: 8,
    background: "#fff", border: "1px solid #E3E8E2", borderRadius: 10, padding: "10px 12px",
  },
  searchInput: { border: "none", outline: "none", flex: 1, fontFamily: "Tajawal, sans-serif", fontSize: 15, background: "transparent", color: "#12312A" },
  select: { border: "1px solid #E3E8E2", borderRadius: 10, padding: "10px 10px", fontFamily: "Tajawal, sans-serif", fontSize: 14.5, background: "#fff", color: "#3F4F44" },
  dropdownBtn: {
    display: "flex", alignItems: "center", gap: 8,
    border: "1px solid #E3E8E2", borderRadius: 10, padding: "10px 12px",
    fontFamily: "Tajawal, sans-serif", fontSize: 14.5, background: "#fff", color: "#3F4F44",
    cursor: "pointer", whiteSpace: "nowrap",
  },
  dropdownBackdrop: { position: "fixed", inset: 0, zIndex: 70 },
  dropdownMenu: {
    position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 160,
    maxHeight: 260, overflowY: "auto",
    background: "#fff", border: "1px solid #E3E8E2", borderRadius: 12,
    boxShadow: "0 10px 30px rgba(18,49,42,0.18)", zIndex: 80, padding: 6,
  },
  dropdownItem: {
    display: "block", width: "100%", textAlign: "right",
    border: "none", borderRadius: 8, padding: "10px 12px",
    fontFamily: "Tajawal, sans-serif", fontSize: 14.5, cursor: "pointer",
  },
  ledgerCard: {
    margin: "16px 20px 0", background: "#fff", border: "1px solid #E3E8E2",
    borderRight: "3px solid #A6462E", borderRadius: 14, overflow: "hidden", padding: "6px 14px 6px",
  },
  ledgerHeaderRow: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 12.5, color: "#8A968D", padding: "10px 4px 6px",
    fontFamily: "Cairo, sans-serif", fontWeight: 700,
  },
  ledgerRule: { height: 1, background: "#E3E8E2", margin: "0 4px" },
  ledgerRow: { display: "flex", alignItems: "center", gap: 8, padding: "12px 4px", borderBottom: "1px dashed #E9ECE8", cursor: "pointer" },
  catIcon: { width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" },
  rowNote: { fontSize: 15, fontWeight: 500, color: "#12312A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  deleteBtn: { border: "none", background: "transparent", color: "#B8A98E", cursor: "pointer", padding: 6, borderRadius: 6 },
  deleteFullBtn: {
    width: "100%", marginTop: 10, background: "transparent", color: "#A6462E",
    border: "1.5px solid #A6462E33", borderRadius: 12, padding: "11px 0",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    fontFamily: "Tajawal, sans-serif", fontWeight: 700, fontSize: 14.5, cursor: "pointer",
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(18,49,42,0.45)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    zIndex: 50, backdropFilter: "blur(2px)",
  },
  modal: {
    background: "#F7F9F6", width: "100%", maxWidth: 460,
    borderRadius: "20px 20px 0 0", padding: "18px 20px 24px",
    maxHeight: "88vh", overflowY: "auto", fontFamily: "Tajawal, sans-serif",
  },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  closeBtn: { border: "none", background: "#EDF1EA", borderRadius: 8, padding: 6, cursor: "pointer", color: "#5A6B5F" },
  typeToggle: { display: "flex", gap: 8, background: "#EDF1EA", borderRadius: 10, padding: 4, marginBottom: 16 },
  typeBtn: { flex: 1, border: "none", borderRadius: 8, padding: "10px 0", fontFamily: "Tajawal, sans-serif", fontWeight: 700, fontSize: 14.5, cursor: "pointer" },
  label: { display: "block", fontSize: 13.5, color: "#5A6B5F", margin: "12px 2px 6px", fontWeight: 500 },
  input: {
    width: "100%", border: "1px solid #E3E8E2", borderRadius: 10,
    padding: "12px 12px", fontFamily: "Tajawal, sans-serif", fontSize: 16,
    background: "#fff", color: "#12312A",
  },
  catGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  catBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    border: "1.5px solid #E3E8E2", borderRadius: 10, padding: "10px 4px",
    cursor: "pointer", fontFamily: "Tajawal, sans-serif",
  },
  errorText: { color: "#A6462E", fontSize: 13.5, marginTop: 10 },
  comingSoonBox: {
    background: "#F1F4F0", border: "1px dashed #E3E8E2", borderRadius: 10,
    padding: "12px 14px", fontSize: 13.5, color: "#5A6B5F", lineHeight: 1.7,
  },
  submitBtn: {
    width: "100%", marginTop: 18, background: "#12312A", color: "#F1F4F0",
    border: "none", borderRadius: 12, padding: "14px 0",
    fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 16, cursor: "pointer",
  },
  toast: {
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    background: "#12312A", color: "#F1F4F0", padding: "11px 22px",
    borderRadius: 30, fontSize: 14.5, fontFamily: "Tajawal, sans-serif",
    boxShadow: "0 6px 20px rgba(0,0,0,0.2)", zIndex: 60,
  },
      itemsCard: {
    margin: "16px 20px 0", background: "#fff", border: "1px solid #E3E8E2",
    borderRight: "3px solid #2F6F4E", borderRadius: 14, padding: "16px",
  },
  itemsHead: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  itemsTitle: { fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: 17, color: "#12312A" },
  itemCard: {
    background: "#F7F9F6", border: "1px solid #E3E8E2", borderRadius: 12, padding: "14px",
  },
  itemName: { fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: 18, color: "#12312A" },
  itemPriceRow: { fontSize: 15, color: "#5A6B5F", marginTop: 4, fontWeight: 600 },
  itemStatsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 },
  itemStatBox: { background: "#EDF1EA", borderRadius: 10, padding: "10px 6px", textAlign: "center" },
  itemStatLabel: { fontSize: 13, color: "#5A6B5F", fontWeight: 600 },
  itemStatValue: { fontSize: 20, fontWeight: 800, color: "#12312A", marginTop: 4, fontVariantNumeric: "tabular-nums" },
  lowStockBadge: {
    display: "flex", alignItems: "center", gap: 6, marginTop: 10,
    background: "#A6462E14", color: "#A6462E", fontWeight: 700, fontSize: 14,
    borderRadius: 8, padding: "8px 12px",
  },
  profitBox: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: 10, background: "#2F6F4E14", borderRadius: 8, padding: "10px 12px",
    fontSize: 15, color: "#12312A", fontWeight: 600,
  },
  profitPct: { fontWeight: 800, fontSize: 16, color: "#2F6F4E" },
  sellBtn: {
    flex: 1, background: "#12312A", color: "#F1F4F0", border: "none",
    borderRadius: 10, padding: "12px 0", fontFamily: "Cairo, sans-serif",
    fontWeight: 700, fontSize: 16, cursor: "pointer",
  },
  bigLabel: { display: "block", fontSize: 15, color: "#3F4F44", margin: "14px 2px 7px", fontWeight: 700 },
  bigInput: {
    width: "100%", border: "1.5px solid #E3E8E2", borderRadius: 10,
    padding: "13px 12px", fontFamily: "Tajawal, sans-serif", fontSize: 17,
    background: "#fff", color: "#12312A",
  },
  saleTotalBox: {
    marginTop: 16, background: "#EDF1EA", borderRadius: 10, padding: "14px",
    fontSize: 18, color: "#12312A", textAlign: "center",
  },
};
