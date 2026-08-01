import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Plus, TrendingUp, TrendingDown, Wallet, Trash2, Search,
  X, Coins, Utensils, Car, Home, Zap, ShoppingBag, HeartPulse,
  Film, Briefcase, PiggyBank, MoreHorizontal, ChevronDown, Sparkles,
  Bell, CheckCircle2, AlertTriangle, CalendarClock,
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

const CURRENCY = "د.أ";

const fmt = (n) =>
  new Intl.NumberFormat("ar-JO", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(Math.abs(n));

const todayISO = () => new Date().toISOString().slice(0, 10);

const uid = () => Math.random().toString(36).slice(2, 10);

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function Daftari() {
  const [transactions, setTransactions] = useState(null); // null = loading
  const [reminders, setReminders] = useState(null); // null = loading
  const [openingBalance, setOpeningBalance] = useState(null); // null = loading
  const [incomeAdjustment, setIncomeAdjustment] = useState(null); // null = loading
  const [expenseAdjustment, setExpenseAdjustment] = useState(null); // null = loading
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("expense");
  const [showReminderForm, setShowReminderForm] = useState(false);
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
        const res = await window.storage.get("transactions");
        setTransactions(res && res.value ? JSON.parse(res.value) : seedData());
      } catch (e) {
        setTransactions(seedData());
      }
      try {
        const res2 = await window.storage.get("reminders");
        setReminders(res2 && res2.value ? JSON.parse(res2.value) : seedReminders());
      } catch (e) {
        setReminders(seedReminders());
      }
      try {
        const res3 = await window.storage.get("openingBalance");
        setOpeningBalance(res3 && res3.value ? JSON.parse(res3.value) : 0);
      } catch (e) {
        setOpeningBalance(0);
      }
      try {
        const res4 = await window.storage.get("incomeAdjustment");
        setIncomeAdjustment(res4 && res4.value ? JSON.parse(res4.value) : 0);
      } catch (e) {
        setIncomeAdjustment(0);
      }
      try {
        const res5 = await window.storage.get("expenseAdjustment");
        setExpenseAdjustment(res5 && res5.value ? JSON.parse(res5.value) : 0);
      } catch (e) {
        setExpenseAdjustment(0);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded || transactions === null) return;
    (async () => {
      try {
        await window.storage.set("transactions", JSON.stringify(transactions));
      } catch (e) {}
    })();
  }, [transactions, loaded]);

  useEffect(() => {
    if (!loaded || reminders === null) return;
    (async () => {
      try {
        await window.storage.set("reminders", JSON.stringify(reminders));
      } catch (e) {}
    })();
  }, [reminders, loaded]);

  useEffect(() => {
    if (!loaded || openingBalance === null) return;
    (async () => {
      try {
        await window.storage.set("openingBalance", JSON.stringify(openingBalance));
      } catch (e) {}
    })();
  }, [openingBalance, loaded]);

  useEffect(() => {
    if (!loaded || incomeAdjustment === null) return;
    (async () => {
      try {
        await window.storage.set("incomeAdjustment", JSON.stringify(incomeAdjustment));
      } catch (e) {}
    })();
  }, [incomeAdjustment, loaded]);

  useEffect(() => {
    if (!loaded || expenseAdjustment === null) return;
    (async () => {
      try {
        await window.storage.set("expenseAdjustment", JSON.stringify(expenseAdjustment));
      } catch (e) {}
    })();
  }, [expenseAdjustment, loaded]);

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
  }

  function addTransaction(tx) {
    setTransactions((prev) => [{ ...tx, id: uid() }, ...prev]);
    showToast(tx.type === "income" ? "تم تسجيل الدخل" : "تم تسجيل المصروف");
  }

  function deleteTransaction(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast("تم حذف القيد");
  }

  function addReminder(rem) {
    setReminders((prev) => [...prev, { ...rem, id: uid(), lastPaidMonth: null }]);
    showToast("تمت إضافة التذكير");
  }

  function deleteReminder(id) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    showToast("تم حذف التذكير");
  }

  function markReminderPaid(rem) {
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setReminders((prev) =>
      prev.map((r) => (r.id === rem.id ? { ...r, lastPaidMonth: key } : r))
    );
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
  }, [sorted, filterType, filterCat, search]);

  const withRunning = useMemo(() => {
    const chronological = [...transactions || []].sort((a, b) => (a.date > b.date ? 1 : -1));
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
        <div style={styles.loadingMark}>د</div>
        <div style={{ fontFamily: "Tajawal, sans-serif", color: "#12312A" }}>
          جارِ فتح الدفتر…
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" lang="ar" style={styles.app}>
      <FontLoader />
      <div style={styles.stitchTop} />

      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>د</div>
          <div>
            <div style={styles.brandTitle}>دفتري</div>
            <div style={styles.brandSub}>محاسبتك اليومية، بلمسة قلم</div>
          </div>
        </div>
        <button
          style={styles.addBtn}
          onClick={() => setShowForm(true)}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Plus size={18} strokeWidth={2.5} />
          قيد جديد
        </button>
      </header>

      <section style={styles.summaryGrid}>
        <SummaryCard
          label="الرصيد الحالي"
          value={totals.balance}
          icon={Wallet}
          tone="ink"
          editable
          onEdit={() => setShowBalanceForm(true)}
        />
        <SummaryCard
          label="إجمالي الدخل"
          value={totals.income}
          icon={TrendingUp}
          tone="income"
          editable
          onEdit={() => setShowIncomeForm(true)}
        />
        <SummaryCard
          label="إجمالي المصروفات"
          value={totals.expense}
          icon={TrendingDown}
          tone="expense"
          editable
          onEdit={() => setShowExpenseForm(true)}
        />
      </section>

      <section style={styles.insightCard}>
        <div style={styles.insightHead}>
          <Sparkles size={18} color="#C9A227" />
          <span>ملاحظات ذكية</span>
        </div>
        <div style={styles.insightBody}>
          {topCategory && (
            <span style={styles.insightChip}>
              أعلى إنفاق: <b>{topCategory.name}</b> ({fmt(topCategory.value)} د.أ)
            </span>
          )}
          {momChange !== null && (
            <span style={styles.insightChip}>
              مصروفات هذا الشهر {momChange >= 0 ? "أعلى" : "أقل"} من الشهر الماضي بنسبة{" "}
              <b>{Math.abs(momChange)}٪</b>
            </span>
          )}
          {savingsRate !== null && (
            <span style={styles.insightChip}>
              معدّل الادخار هذا الشهر: <b>{savingsRate}٪</b> من الدخل
            </span>
          )}
          {!topCategory && momChange === null && savingsRate === null && (
            <span style={styles.insightChip}>أضف بعض القيود لتظهر لك الملاحظات هنا</span>
          )}
        </div>
      </section>

      <section style={styles.remindersCard}>
        <div style={styles.remindersHead}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={17} color="#12312A" />
            <span style={styles.remindersTitle}>الالتزامات الشهرية</span>
            {urgentCount > 0 && (
              <span style={styles.urgentBadge}>{urgentCount}</span>
            )}
          </div>
          <button style={styles.smallAddBtn} onClick={() => setShowReminderForm(true)}>
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
                <div key={r.id} style={styles.reminderRow}>
                  <span style={{ ...styles.catIcon, background: meta.color + "22", color: meta.color }}>
                    <Icon size={15} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.rowNote}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: "#8A968D" }}>{r.category}</div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13.5, fontVariantNumeric: "tabular-nums", color: "#12312A" }}>
                    {fmt(r.amount)} {CURRENCY}
                  </span>
                  <span style={{ ...styles.statusBadge, background: badge.bg, color: badge.fg }}>
                    {r.state === "paid" && <CheckCircle2 size={12} />}
                    {r.state === "overdue" && <AlertTriangle size={12} />}
                    {badge.text}
                  </span>
                  {r.state !== "paid" && (
                    <button style={styles.payBtn} onClick={() => markReminderPaid(r)}>
                      تسجيل الدفع
                    </button>
                  )}
                  <button
                    onClick={() => deleteReminder(r.id)}
                    style={styles.deleteBtn}
                    aria-label="حذف التذكير"
                    title="حذف"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>توزيع المصروفات حسب الفئة</div>
          {categoryBreakdown.length ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 150, height: 150, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {categoryBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(v, n) => [`${fmt(v)} د.أ`, n]}
                      contentStyle={{ fontFamily: "Tajawal, sans-serif", direction: "rtl", borderRadius: 8, border: "1px solid #E3E8E2" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
{categoryBreakdown.slice(0, 5).map((c) => (
                  <div key={c.name} style={styles.legendRow}>
                    <span style={{ ...styles.legendDot, background: c.color }} />
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span style={{ color: "#5A6B5F", fontVariantNumeric: "tabular-nums" }}>
                      {fmt(c.value)}
                    </span>
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
                <XAxis dataKey="day" tick={{ fontFamily: "Tajawal, sans-serif", fontSize: 11, fill: "#5A6B5F" }} axisLine={{ stroke: "#D8DED6" }} tickLine={false} />
                <YAxis tick={{ fontFamily: "Tajawal, sans-serif", fontSize: 10, fill: "#5A6B5F" }} axisLine={false} tickLine={false} />
                <ReTooltip
                  formatter={(v) => [`${fmt(v)} د.أ`, "مصروف"]}
                  contentStyle={{ fontFamily: "Tajawal, sans-serif", direction: "rtl", borderRadius: 8, border: "1px solid #E3E8E2" }}
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
          <Search size={16} color="#5A6B5F" />
          <input
            placeholder="ابحث في القيود…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterCat("all"); }} style={styles.select}>
          <option value="all">كل الأنواع</option>
          <option value="income">دخل</option>
          <option value="expense">مصروف</option>
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={styles.select}>
          <option value="all">كل الفئات</option>
          {(filterType === "income" ? INCOME_CATS : filterType === "expense" ? EXPENSE_CATS : ALL_CATS)
            .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
            .map((c) => (
              <option key={c.id} value={c.id}>{c.id}</option>
            ))}
        </select>
      </section>

      <section style={styles.ledgerCard}>
        <div style={styles.ledgerHeaderRow}>
          <span style={{ flex: "0 0 34px" }} />
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
              <div key={t.id} style={styles.ledgerRow}>
                <span style={{ flex: "0 0 34px" }}>
                  <span style={{ ...styles.catIcon, background: meta.color + "22", color: meta.color }}>
                    <Icon size={15} />
                  </span>
                </span>
                <span style={{ flex: 2, minWidth: 0 }}>
                  <div style={styles.rowNote}>{t.note || "بدون بيان"}</div>
                </span>
                <span style={{ flex: 1, color: "#5A6B5F", fontSize: 13 }}>{t.category}</span>
                <span style={{ flex: 1, color: "#5A6B5F", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                  {t.date}
                </span>
                <span
                  style={{
                    flex: 1,
                    textAlign: "left",
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: t.type === "income" ? "#2F6F4E" : "#A6462E",
                  }}
                >
                  {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
                </span>
                <span style={{ flex: 1, textAlign: "left", fontVariantNumeric: "tabular-nums", color: "#12312A" }}>
                  {fmt(t.running)}
                </span>
                <span style={{ flex: "0 0 34px", textAlign: "left" }}>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    style={styles.deleteBtn}
                    aria-label="حذف القيد"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            );
          })
        )}
      </section>

      {showForm && (
        <TransactionForm
          type={formType}
          setType={setFormType}
          onClose={() => setShowForm(false)}
          onSubmit={(tx) => {
            addTransaction(tx);
            setShowForm(false);
          }}
        />
      )}

      {showReminderForm && (
        <ReminderForm
          onClose={() => setShowReminderForm(false)}
          onSubmit={(rem) => {
            addReminder(rem);
            setShowReminderForm(false);
          }}
        />
      )}

      {showBalanceForm && (
        <AmountEditForm
          title="تعديل الرصيد الحالي"
          hint="اكتب رصيدك الفعلي الآن. سيتم ضبط النقطة المرجعية للدفتر تلقائيًا بحيث يطابق حساب الدخل والمصروفات هذا الرقم، دون التأثير على القيود المسجّلة."
          current={totals.balance}
          onClose={() => setShowBalanceForm(false)}
          onSubmit={(val) => {
            setBalance(val);
            setShowBalanceForm(false);
          }}
        />
      )}

      {showIncomeForm && (
        <AmountEditForm
          title="تعديل إجمالي الدخل"
          hint="اكتب إجمالي الدخل الصحيح. سيتم إضافة فرق تسوية تلقائيًا ليطابق مجموع القيود هذا الرقم، والرصيد الحالي سيتحدّث معه."
          current={totals.income}
          onClose={() => setShowIncomeForm(false)}
          onSubmit={(val) => {
            setIncome(val);
            setShowIncomeForm(false);
          }}
        />
      )}

      {showExpenseForm && (
        <AmountEditForm
          title="تعديل إجمالي المصروفات"
          hint="اكتب إجمالي المصروفات الصحيح. سيتم إضافة فرق تسوية تلقائيًا ليطابق مجموع القيود هذا الرقم، والرصيد الحالي سيتحدّث معه."
          current={totals.expense}
          onClose={() => setShowExpenseForm(false)}
          onSubmit={(val) => {
            setExpense(val);
            setShowExpenseForm(false);
          }}
        />
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone, editable, onEdit }) {
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
        position: "relative",
      }}
      onClick={editable ? onEdit : undefined}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={editable ? (e) => { if (e.key === "Enter") onEdit(); } : undefined}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 13, opacity: 0.85 }}>{label}</span>
        <Icon size={16} color={toneStyles.accent} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8, fontVariantNumeric: "tabular-nums", color: toneStyles.bg === "#FFFFFF" ? toneStyles.fg : "#F1F4F0" }}>
        {fmt(value)} <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>د.أ</span>
      </div>
      {editable && (
        <span style={{ fontSize: 10.5, opacity: 0.65, marginTop: 4, display: "block" }}>
          اضغط للتعديل
        </span>
      )}
    </div>
  );
}

function EmptyMini({ text, tall }) {
  return (
    <div style={{ padding: tall ? "36px 12px" : "20px 12px", textAlign: "center", color: "#8A968D", fontSize: 13.5 }}>
      {text}
    </div>
  );
}

function TransactionForm({ type, setType, onClose, onSubmit }) {
  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(cats[0].id);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");

  useEffect(() => {
    setCategory((type === "income" ? INCOME_CATS : EXPENSE_CATS)[0].id);
  }, [type]);

  function submit() {
    const n = parseFloat(amount);
    if (!amount || isNaN(n) || n <= 0) {
      setError("أدخل مبلغًا صحيحًا أكبر من صفر");
      return;
    }
    if (!date) {
      setError("اختر تاريخًا للقيد");
      return;
    }
    onSubmit({ type, amount: n, category, note: note.trim(), date });
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} dir="rtl">
        <div style={styles.modalHead}>
          <span style={{ fontWeight: 800, fontSize: 17, color: "#12312A" }}>قيد جديد</span>
          <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>
        </div>

        <div style={styles.typeToggle}>
          <button
            onClick={() => setType("expense")}
            style={{
              ...styles.typeBtn,
              background: type === "expense" ? "#A6462E" : "transparent",
              color: type === "expense" ? "#fff" : "#5A6B5F",
            }}
          >
            مصروف
          </button>
          <button
            onClick={() => setType("income")}
            style={{
              ...styles.typeBtn,
              background: type === "income" ? "#2F6F4E" : "transparent",
              color: type === "income" ? "#fff" : "#5A6B5F",
            }}
          >
            دخل
          </button>
        </div>

        <label style={styles.label}>المبلغ</label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          style={styles.input}
          autoFocus
        />

        <label style={styles.label}>الفئة</label>
        <div style={styles.catGrid}>
          {cats.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  ...styles.catBtn,
                  borderColor: active ? c.color : "#E3E8E2",
                  background: active ? c.color + "1A" : "#fff",
                  color: active ? c.color : "#5A6B5F",
                }}
              >
                <Icon size={16} />
                <span style={{ fontSize: 12 }}>{c.id}</span>
              </button>
            );
          })}
        </div>

        <label style={styles.label}>بيان (اختياري)</label>
        <input
          type="text"
          placeholder="مثال: فاتورة الإنترنت"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>التاريخ</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={styles.input}
        />

        {error && <div style={styles.errorText}>{error}</div>}

        <button style={styles.submitBtn} onClick={submit}>
          حفظ القيد
        </button>
      </div>
    </div>
  );
}

function ReminderForm({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATS[0].id);
  const [dueDay, setDueDay] = useState(1);
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
          <span style={{ fontWeight: 800, fontSize: 17, color: "#12312A" }}>تذكير مصروف شهري</span>
          <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>
        </div>

        <label style={styles.label}>اسم الالتزام</label>
        <input
          type="text"
          placeholder="مثال: إيجار الشقة، اشتراك الإنترنت"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          style={styles.input}
          autoFocus
        />

        <label style={styles.label}>المبلغ ({CURRENCY})</label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          style={styles.input}
        />

        <label style={styles.label}>الفئة</label>
        <div style={styles.catGrid}>
          {EXPENSE_CATS.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  ...styles.catBtn,
                  borderColor: active ? c.color : "#E3E8E2",
                  background: active ? c.color + "1A" : "#fff",
                  color: active ? c.color : "#5A6B5F",
                }}
              >
                <Icon size={16} />
                <span style={{ fontSize: 12 }}>{c.id}</span>
              </button>
            );
          })}
        </div>

        <label style={styles.label}>يتكرر كل شهر في اليوم</label>
        <input
          type="number"
          min={1}
          max={31}
          value={dueDay}
          onChange={(e) => { setDueDay(e.target.value); setError(""); }}
          style={styles.input}
        />

        {error && <div style={styles.errorText}>{error}</div>}

        <button style={styles.submitBtn} onClick={submit}>
          حفظ التذكير
        </button>
      </div>
    </div>
  );
}

function AmountEditForm({ title, hint, current, onClose, onSubmit }) {
  const [value, setValue] = useState(String(Math.round(current * 100) / 100));
  const [error, setError] = useState("");

  function submit() {
    const n = parseFloat(value);
    if (value === "" || isNaN(n)) {
      setError("أدخل رقمًا صحيحًا");
      return;
    }
    onSubmit(n);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} dir="rtl">
        <div style={styles.modalHead}>
          <span style={{ fontWeight: 800, fontSize: 17, color: "#12312A" }}>{title}</span>
          <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>
        </div>

        <p style={{ fontSize: 12.5, color: "#5A6B5F", margin: "0 2px 14px", lineHeight: 1.7 }}>
          {hint}
        </p>

        <label style={styles.label}>القيمة ({CURRENCY})</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          style={styles.input}
          autoFocus
        />

        {error && <div style={styles.errorText}>{error}</div>}

        <button style={styles.submitBtn} onClick={submit}>
          حفظ
        </button>
      </div>
    </div>
  );
}

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&family=Tajawal:wght@400;500;700&display=swap');
      * { box-sizing: border-box; }
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
  app: {
    fontFamily: "Tajawal, sans-serif",
    background: "#F1F4F0",
    minHeight: "100vh",
    color: "#12312A",
    padding: "0 0 40px 0",
    maxWidth: 760,
    margin: "0 auto",
    position: "relative",
  },
  loadingScreen: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: "#F1F4F0",
  },
  loadingMark: {
    width: 48, height: 48, borderRadius: "50%",
    background: "#12312A", color: "#C9A227",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: 22,
  },
  stitchTop: {
    height: 6,
    backgroundImage: "repeating-linear-gradient(90deg, #C9A227 0 10px, transparent 10px 20px)",
    opacity: 0.55,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 20px 8px",
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  brandMark: {
    width: 42, height: 42, borderRadius: 12,
    background: "#12312A", color: "#C9A227",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: 19,
    flexShrink: 0,
  },
  brandTitle: { fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: 20, lineHeight: 1.2 },
  brandSub: { fontSize: 12.5, color: "#5A6B5F", marginTop: 1 },
  addBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#C9A227", color: "#12312A",
    border: "none", borderRadius: 10,
    padding: "10px 16px", fontFamily: "Tajawal, sans-serif",
    fontWeight: 700, fontSize: 14, cursor: "pointer",
    transition: "transform 0.15s ease", boxShadow: "0 2px 0 #A9861C",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    padding: "12px 20px 0",
  },
  summaryCard: {
    borderRadius: 14,
    padding: "14px 16px",
    border: "1px solid #E3E8E2",
  },
  insightCard: {
    margin: "16px 20px 0",
    background: "#fff",
    border: "1px solid #E3E8E2",
    borderRight: "3px solid #C9A227",
    borderRadius: 12,
    padding: "12px 16px",
  },
  insightHead: {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13.5, color: "#12312A",
    marginBottom: 8,
  },
  insightBody: { display: "flex", flexWrap: "wrap", gap: 8 },
  insightChip: {
    fontSize: 12.5, color: "#3F4F44", background: "#F1F4F0",
    borderRadius: 20, padding: "5px 12px",
  },
  remindersCard: {
    margin: "16px 20px 0",
    background: "#fff",
    border: "1px solid #E3E8E2",
    borderRight: "3px solid #12312A",
    borderRadius: 14,
    padding: "14px 16px",
  },
  remindersHead: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  remindersTitle: { fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14, color: "#12312A" },
  urgentBadge: {
    background: "#A6462E", color: "#fff", fontSize: 11, fontWeight: 700,
    borderRadius: 20, padding: "1px 8px", fontFamily: "Tajawal, sans-serif",
  },
  smallAddBtn: {
    display: "flex", alignItems: "center", gap: 4,
    background: "#F1F4F0", border: "1px solid #E3E8E2", color: "#12312A",
    borderRadius: 8, padding: "6px 10px", fontSize: 12.5, fontWeight: 700,
    fontFamily: "Tajawal, sans-serif", cursor: "pointer",
  },
  reminderRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 4px", borderBottom: "1px dashed #E9ECE8", flexWrap: "wrap",
  },
  statusBadge: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "3px 9px",
    fontFamily: "Tajawal, sans-serif", whiteSpace: "nowrap",
  },
  payBtn: {
    border: "1px solid #2F6F4E", background: "#2F6F4E0F", color: "#2F6F4E",
    borderRadius: 8, padding: "5px 10px", fontSize: 11.5, fontWeight: 700,
    fontFamily: "Tajawal, sans-serif", cursor: "pointer", whiteSpace: "nowrap",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: 12,
    padding: "16px 20px 0",
  },
  chartCard: {
    background: "#fff", border: "1px solid #E3E8E2", borderRadius: 14,
    padding: "14px 16px",
  },
  chartTitle: { fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13.5, marginBottom: 10, color: "#12312A" },
  legendRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 },
  legendDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
  controls: {
    display: "flex", gap: 10, padding: "18px 20px 0", flexWrap: "wrap",
  },
  searchBox: {
    flex: "1 1 200px", display: "flex", alignItems: "center", gap: 8,
    background: "#fff", border: "1px solid #E3E8E2", borderRadius: 10,
    padding: "9px 12px",
  },
  searchInput: {
    border: "none", outline: "none", flex:   
      1, fontFamily: "Tajawal, sans-serif",
    fontSize: 13.5, background: "transparent", color: "#12312A",
  },
  select: {
    border: "1px solid #E3E8E2", borderRadius: 10, padding: "9px 10px",
    fontFamily: "Tajawal, sans-serif", fontSize: 13, background: "#fff", color: "#3F4F44",
  },
  ledgerCard: {
    margin: "16px 20px 0",
    background: "#fff",
    border: "1px solid #E3E8E2",
    borderRight: "3px solid #A6462E",
    borderRadius: 14,
    overflow: "hidden",
    padding: "6px 14px 6px",
  },
  ledgerHeaderRow: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 11.5, color: "#8A968D", padding: "10px 4px 6px",
    fontFamily: "Cairo, sans-serif", fontWeight: 700,
  },
  ledgerRule: { height: 1, background: "#E3E8E2", margin: "0 4px" },
  ledgerRow: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "11px 4px", borderBottom: "1px dashed #E9ECE8",
  },
  catIcon: {
    width: 28, height: 28, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  rowNote: { fontSize: 13.5, fontWeight: 500, color: "#12312A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  deleteBtn: {
    border: "none", background: "transparent", color: "#B8A98E",
    cursor: "pointer", padding: 6, borderRadius: 6,
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(18,49,42,0.45)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    zIndex: 50, backdropFilter: "blur(2px)",
  },
  modal: {
    background: "#F7F9F6", width: "100%", maxWidth: 460,
    borderRadius: "20px 20px 0 0", padding: "18px 20px 24px",
    maxHeight: "88vh", overflowY: "auto",
    fontFamily: "Tajawal, sans-serif",
  },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  closeBtn: { border: "none", background: "#EDF1EA", borderRadius: 8, padding: 6, cursor: "pointer", color: "#5A6B5F" },
  typeToggle: {
    display: "flex", gap: 8, background: "#EDF1EA", borderRadius: 10, padding: 4, marginBottom: 16,
  },
  typeBtn: {
    flex: 1, border: "none", borderRadius: 8, padding: "9px 0",
    fontFamily: "Tajawal, sans-serif", fontWeight: 700, fontSize: 13.5, cursor: "pointer",
  },
  label: { display: "block", fontSize: 12.5, color: "#5A6B5F", margin: "12px 2px 6px", fontWeight: 500 },
  input: {
    width: "100%", border: "1px solid #E3E8E2", borderRadius: 10,
    padding: "11px 12px", fontFamily: "Tajawal, sans-serif", fontSize: 14.5,
    background: "#fff", color: "#12312A",
  },
  catGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  catBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    border: "1.5px solid #E3E8E2", borderRadius: 10, padding: "9px 4px",
    cursor: "pointer", fontFamily: "Tajawal, sans-serif",
  },
  errorText: { color: "#A6462E", fontSize: 12.5, marginTop: 10 },
  submitBtn: {
    width: "100%", marginTop: 18, background: "#12312A", color: "#F1F4F0",
    border: "none", borderRadius: 12, padding: "13px 0",
    fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer",
  },
  toast: {
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    background: "#12312A", color: "#F1F4F0", padding: "10px 20px",
    borderRadius: 30, fontSize: 13.5, fontFamily: "Tajawal, sans-serif",
    boxShadow: "0 6px 20px rgba(0,0,0,0.2)", zIndex: 60,
  },
};
