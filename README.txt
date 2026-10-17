موقع مشتل سما الكوت — نسخة جاهزة للرفع

محتويات المجلد:
- index.html: الصفحة الرئيسية
- config.js: إعداد اتصال Supabase
- assets/: الشعارات والصور الرسمية
- supabase_setup.sql: سياسات قراءة عامة للكتالوج فقط

مهم:
هذه نسخة واجهة كتالوج تقرأ المنتجات من Supabase. إدارة الأسعار وإضافة النباتات حالياً تتم من Supabase > Table Editor، وليس من لوحة إدارة داخل الموقع. لا تضع مفتاح Secret أو service_role في الموقع.

إعداد المفتاح:
1) افتح config.js بمحرر نصوص.
2) استبدل PASTE_YOUR_PUBLISHABLE_KEY_HERE بالمفتاح الذي يبدأ بـ sb_publishable_ من Project Settings > API Keys.
3) احفظ الملف.

سياسات القراءة:
1) افتح Supabase > SQL Editor.
2) افتح ملف supabase_setup.sql وانسخ محتواه إلى SQL Editor ثم اضغط Run.
هذه السياسات تسمح للزوار بقراءة أسماء الفئات والمنتجات المتاحة فقط؛ لا تسمح بإضافة أو تعديل أو حذف من الواجهة العامة.

رفع الملفات إلى GitHub:
- افتح المستودع sama-alkut-nursery.
- اضغط Add file > Upload files.
- ارفع index.html و config.js و README.txt و supabase_setup.sql ومجلد assets بمحتوياته. إذا لم يسمح متصفح الهاتف برفع مجلد كامل، أنشئ مجلد assets في GitHub ثم ارفع الصور داخله.
- اضغط Commit changes.

بعدها تحتاج استضافة static للموقع (مثل Cloudflare Pages) وربطها بمستودع GitHub. مجرد رفع الملفات إلى GitHub لا ينشئ رابط موقع منشور.
