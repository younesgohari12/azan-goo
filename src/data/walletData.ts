import type { Recipient, WalletSnapshot, WithdrawDestination } from './types'

/**
 * دادهٔ نمونهٔ کیف پول — فقط برای پیش‌نمایش و کاملاً از اجزای UI جدا است.
 *
 * - تاریخ‌ها ISO هستند و هنگام نمایش به تقویم و ارقام فارسی تبدیل می‌شوند.
 * - مبالغ به تومان و علامت‌دارند: مثبت = ورودی، منفی = خروجی.
 * - فهرست تراکنش‌ها «فعالیت‌های اخیر» است، نه دفتر کل کامل (۱۳ مورد نمونه،
 *   برای اینکه صفحه‌بندی محلی تاریخچه معنا داشته باشد).
 * - مجموع ورودی‌های در انتظار (۱۲۰٬۰۰۰ + ۲۳۰٬۰۰۰) با موجودی در انتظار هم‌خوان است.
 */
export const walletSnapshot: WalletSnapshot = {
  balance: 2_450_000,
  pendingBalance: 350_000,
  transactions: [
    {
      id: 'tx-1041',
      kind: 'topup',
      title: 'افزایش اعتبار از درگاه بانکی',
      amount: 500_000,
      status: 'success',
      date: '2026-10-14T14:32:00+03:30',
      reference: 'ORB-48213',
      note: 'افزایش اعتبار از کارت بانک سامان',
    },
    {
      id: 'tx-1040',
      kind: 'transfer_out',
      title: 'انتقال به سارا محمدی',
      counterparty: 'سارا محمدی',
      amount: -180_000,
      status: 'success',
      date: '2026-10-13T19:05:00+03:30',
      reference: 'ORB-48190',
      note: 'سهم شام دیشب',
    },
    {
      id: 'tx-1039',
      kind: 'transfer_in',
      title: 'انتقال از امیر رضایی',
      counterparty: 'امیر رضایی',
      amount: 250_000,
      status: 'success',
      date: '2026-10-13T11:20:00+03:30',
      reference: 'ORB-48177',
    },
    {
      id: 'tx-1038',
      kind: 'topup',
      title: 'افزایش اعتبار از درگاه بانکی',
      amount: 1_000_000,
      status: 'success',
      date: '2026-10-11T09:48:00+03:30',
      reference: 'ORB-47902',
      note: 'افزایش اعتبار از کارت بانک ملت',
    },
    {
      id: 'tx-1037',
      kind: 'transfer_in',
      title: 'انتقال از مریم احمدی',
      counterparty: 'مریم احمدی',
      amount: 120_000,
      status: 'pending',
      date: '2026-10-10T12:05:00+03:30',
      reference: 'ORB-47844',
      note: 'در انتظار تأیید میزبان',
    },
    {
      id: 'tx-1036',
      kind: 'withdraw',
      title: 'برداشت به کارت بانک ملت',
      counterparty: 'کارت بانک ملت',
      amount: -400_000,
      status: 'pending',
      date: '2026-10-10T16:12:00+03:30',
      reference: 'ORB-47861',
      fee: 5_000,
    },
    {
      id: 'tx-1035',
      kind: 'transfer_in',
      title: 'انتقال از حسین توکلی',
      counterparty: 'حسین توکلی',
      amount: 230_000,
      status: 'pending',
      date: '2026-10-08T08:30:00+03:30',
      reference: 'ORB-47710',
      note: 'در انتظار تأیید میزبان',
    },
    {
      id: 'tx-1034',
      kind: 'transfer_out',
      title: 'انتقال به نگار کریمی',
      counterparty: 'نگار کریمی',
      amount: -95_000,
      status: 'failed',
      date: '2026-10-08T21:40:00+03:30',
      reference: 'ORB-47742',
      note: 'پیش از تأیید لغو شد',
    },
    {
      id: 'tx-1033',
      kind: 'refund',
      title: 'بازگشت وجه خرید',
      amount: 45_000,
      status: 'success',
      date: '2026-10-05T13:02:00+03:30',
      reference: 'ORB-47488',
      note: 'بازگشت وجه خرید ناموفق',
    },
    {
      id: 'tx-1032',
      kind: 'transfer_out',
      title: 'انتقال به علی صادقی',
      counterparty: 'علی صادقی',
      amount: -320_000,
      status: 'success',
      date: '2026-10-04T18:22:00+03:30',
      reference: 'ORB-47355',
      note: 'اجارهٔ پارکینگ',
    },
    {
      id: 'tx-1031',
      kind: 'topup',
      title: 'افزایش اعتبار از درگاه بانکی',
      amount: 300_000,
      status: 'success',
      date: '2026-10-02T09:10:00+03:30',
      reference: 'ORB-47120',
    },
    {
      id: 'tx-1030',
      kind: 'withdraw',
      title: 'برداشت به کارت بانک سامان',
      counterparty: 'کارت بانک سامان',
      amount: -150_000,
      status: 'failed',
      date: '2026-09-30T20:44:00+03:30',
      reference: 'ORB-46988',
      fee: 5_000,
      note: 'کارت مقصد پذیرفته نشد',
    },
    {
      id: 'tx-1029',
      kind: 'refund',
      title: 'بازگشت وجه خرید',
      amount: 90_000,
      status: 'success',
      date: '2026-09-28T11:05:00+03:30',
      reference: 'ORB-46710',
      note: 'بازگشت وجه خرید ناموفق',
    },
  ],
}

/** گیرنده‌های نمونه برای فرم انتقال */
export const transferRecipients: Recipient[] = [
  { id: 'rcp-1', name: 'سارا محمدی', handle: 'sara.m', phone: '09123456789' },
  { id: 'rcp-2', name: 'امیر رضایی', handle: 'amir.r', phone: '09121112233' },
  { id: 'rcp-3', name: 'نگار کریمی', handle: 'negar.k', phone: '09129887766' },
  { id: 'rcp-4', name: 'حسین توکلی', handle: 'hossein.t', phone: '09124445566' },
  { id: 'rcp-5', name: 'مریم احمدی', handle: 'maryam.a', phone: '09127778899' },
  { id: 'rcp-6', name: 'علی صادقی', handle: 'ali.s', phone: '09123334455' },
]

/** مقصدهای نمونهٔ برداشت */
export const withdrawDestinations: WithdrawDestination[] = [
  { id: 'dst-1', label: 'کارت بانکی سامان', bank: 'بانک سامان', last4: '4567' },
  { id: 'dst-2', label: 'کارت بانکی ملت', bank: 'بانک ملت', last4: '1234' },
]
