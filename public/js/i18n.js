'use strict';

/*
 * ترجمة الواجهة (العربية ⇄ الإنجليزية).
 * يُحمَّل في <head> لضبط اللغة والاتجاه قبل عرض الصفحة.
 * العناصر: data-i18n (نص)، data-i18n-html (نص منسق ثابت)، data-i18n-placeholder، data-i18n-alt، data-i18n-aria.
 */
(function () {
  const STRINGS = {
    ar: {
      'brand.bae': 'BAE Systems',
      'brand.hayatna': 'عيادات حياتنا',
      'app.title': 'العمر البيولوجي',
      'lang.switch': 'English',
      'lang.short': 'EN',
      'lang.aria': 'التبديل إلى اللغة الإنجليزية',
      footer: 'BAE Systems × عيادات حياتنا',

      // صفحة الإدخال
      'form.pageTitle': 'العمر البيولوجي — إدخال البيانات',
      'form.eyebrow': 'تقييم اللياقة البدنية',
      'form.heading': 'احسب عمرك البيولوجي',
      'form.intro': 'أدخل بياناتك ونتائج اختباري اللياقة لتحصل على تقدير حسابي لعمرك البيولوجي وتصنيف كل اختبار، مع توصيات عامة للنشاط البدني.',
      'form.basic': 'المعلومات الأساسية',
      'form.tests': 'نتائج اختبارات اللياقة',
      'f.name': 'الاسم',
      'f.gender': 'الجنس',
      'f.male': 'ذكر',
      'f.female': 'أنثى',
      'f.age': 'العمر',
      'f.ageUnit': 'سنة',
      'f.ageHint': '18 سنة فأكثر',
      'f.phone': 'رقم التواصل',
      'f.hr': 'نبض القلب بعد اختبار الخطوة',
      'f.hrUnit': 'ضربة/دقيقة',
      'f.hrHint': 'بعد اختبار الخطوة لمدة 3 دقائق — عدد صحيح',
      'f.pbf': 'نسبة الدهون في الجسم (PBF)',
      'f.pbfHint': 'من جهاز InBody — يقبل الكسور العشرية (مثال: 23.5)',
      'form.submit': 'إرسال النتائج',
      'form.submitting': 'جارٍ الحساب…',
      'form.disclaimer': 'النتيجة <strong>تقدير حسابي وفق معادلة الموقع</strong> وليست تشخيصًا طبيًا. تُعامل بياناتك الصحية بسرية، ولا يطّلع على السجلات الفردية إلا المخولون من الإدارة.',
      'v.required': 'هذا الحقل مطلوب.',
      'v.nameLength': 'يرجى إدخال اسم بين حرفين و100 حرف.',
      'v.gender': 'يرجى اختيار الجنس.',
      'v.ageNumber': 'يرجى إدخال العمر رقمًا صحيحًا بالسنوات.',
      'v.ageMin': 'يجب أن يكون العمر 18 سنة فأكثر.',
      'v.ageMax': 'يرجى التأكد من العمر المدخل.',
      'v.phone': 'يرجى إدخال رقم تواصل صحيح (من 9 إلى 15 رقمًا).',
      'v.hrNumber': 'يرجى إدخال النبض عددًا صحيحًا بدون كسور.',
      'v.hrPositive': 'يجب أن يكون النبض أكبر من صفر.',
      'v.pbfNumber': 'يرجى إدخال نسبة الدهون رقمًا (تُقبل الكسور العشرية).',
      'v.pbfRange': 'يجب أن تكون نسبة الدهون بين 0% و100%.',
      'net.submit': 'تعذر إرسال البيانات. يرجى المحاولة مرة أخرى.',
      'net.offline': 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',

      // صفحة النتيجة
      'res.pageTitle': 'العمر البيولوجي — النتيجة',
      'res.headerTitle': 'نتيجة العمر البيولوجي',
      'res.loading': 'جارٍ تحميل النتيجة…',
      'res.summary': 'ملخص النتيجة',
      'res.chrono': 'العمر الزمني',
      'res.bio': 'العمر البيولوجي التقديري',
      'res.years': 'سنة',
      'res.diffSub': 'الفارق بين العمر البيولوجي التقديري والعمر الزمني',
      'res.younger': 'عمرك البيولوجي التقديري أصغر من عمرك الزمني بـ {years}',
      'res.older': 'عمرك البيولوجي التقديري أكبر من عمرك الزمني بـ {years}',
      'res.equal': 'عمرك البيولوجي التقديري مساوٍ لعمرك الزمني',
      'res.hr': 'نبض القلب بعد اختبار الخطوة',
      'res.pbf': 'نسبة الدهون في الجسم (PBF)',
      'res.recs': 'توصيات عامة للنشاط البدني',
      'res.recsPersonal': 'بناءً على نتائجك',
      'res.recsGeneral': 'إرشادات منظمة الصحة العالمية للبالغين',
      'res.disclaimer': 'هذه النتيجة <strong>تقدير حسابي وفق معادلة الموقع</strong> وليست تشخيصًا طبيًا، والتوصيات توعوية عامة. استشر الطبيب قبل البدء ببرنامج رياضي جديد إذا كانت لديك حالة صحية أو أعراض.',
      'res.print': 'طباعة / حفظ PDF',
      'res.new': 'تقييم جديد',
      'res.noneTitle': 'لا توجد نتيجة لعرضها',
      'res.noneText': 'يرجى إدخال بياناتك ونتائج الاختبارات أولًا.',
      'res.missingTitle': 'النتيجة غير متاحة',
      'res.missingText': 'انتهت صلاحية رابط النتيجة أو أنه غير صحيح.',
      'res.failTitle': 'تعذر تحميل النتيجة',
      'res.failText': 'تحقق من اتصالك بالإنترنت ثم أعد تحميل الصفحة.',
      'res.back': 'العودة إلى صفحة الإدخال',

      // الدخول
      'login.pageTitle': 'دخول الإدارة — العمر البيولوجي',
      'login.headerTitle': 'لوحة الإدارة',
      'login.heading': 'دخول الإدارة',
      'login.hint': 'للحسابات المخولة فقط.',
      'login.username': 'اسم المستخدم',
      'login.password': 'كلمة المرور',
      'login.submit': 'دخول',
      'login.missing': 'يرجى إدخال اسم المستخدم وكلمة المرور.',
      'login.failed': 'تعذر تسجيل الدخول.',
      'login.offline': 'تعذر الاتصال بالخادم.',

      // لوحة الإدارة
      'adm.pageTitle': 'لوحة الإدارة — العمر البيولوجي',
      'adm.headerTitle': 'لوحة الإدارة — العمر البيولوجي',
      'adm.reportsTitle': 'التقارير والإحصاءات',
      'adm.logout': 'تسجيل الخروج',
      'adm.roleAdmin': 'مدير (صلاحية كاملة)',
      'adm.roleAnalyst': 'محلل (تقارير مجمعة فقط)',
      'nav.reports': 'التقارير', 'nav.records': 'السجلات', 'nav.users': 'الحسابات', 'nav.audit': 'سجل التدقيق', 'nav.account': 'حسابي',
      'flt.from': 'من تاريخ', 'flt.to': 'إلى تاريخ', 'flt.gender': 'الجنس', 'flt.age': 'الفئة العمرية', 'flt.all': 'الكل',
      'flt.apply': 'تطبيق', 'flt.reset': 'مسح', 'flt.aria': 'مرشحات التقارير',
      'kpi.count': 'عدد التقييمات', 'kpi.points': 'متوسط مجموع النقاط', 'kpi.bio': 'متوسط العمر التقديري', 'kpi.diff': 'متوسط الفارق',
      'kpi.avgAge': 'متوسط العمر الزمني {n}', 'kpi.split': 'أصغر {a} · مساوٍ {b} · أكبر {c}',
      'dist.hr': 'توزيع تصنيفات اختبار الخطوة', 'dist.pbf': 'توزيع تصنيفات نسبة الدهون PBF', 'dist.points': 'النقاط {n}',
      'grp.title': 'النتائج حسب الجنس والفئة العمرية', 'grp.gender': 'حسب الجنس', 'grp.age': 'حسب الفئة العمرية', 'grp.cross': 'الجنس × الفئة العمرية',
      'col.gender': 'الجنس', 'col.ageGroup': 'الفئة العمرية', 'col.count': 'العدد', 'col.avgPoints': 'متوسط النقاط',
      'col.avgAge': 'متوسط العمر الزمني', 'col.avgBio': 'متوسط العمر التقديري', 'col.avgDiff': 'متوسط الفارق', 'col.split': 'أصغر / مساوٍ / أكبر',
      'tbl.empty': 'لا توجد بيانات.',
      'exp.title': 'تصدير التقارير',
      'exp.hint': 'تُطبق المرشحات الحالية على ملفات التصدير. التقارير لا تتضمن الاسم أو رقم التواصل افتراضيًا.',
      'exp.stats': 'تقرير إحصائي مجمع (CSV)', 'exp.records': 'سجلات بدون بيانات شخصية (CSV)', 'exp.pii': 'سجلات مع الاسم ورقم التواصل',
      'exp.piiConfirm': 'سيتضمن الملف الأسماء وأرقام التواصل (بيانات شخصية حساسة) وسيُسجَّل هذا الإجراء. هل تريد المتابعة؟',
      'rules.title': 'جداول التصنيف المعتمدة (من قاعدة البيانات)', 'rules.hr': 'نبض القلب بعد اختبار الخطوة', 'rules.pbf': 'نسبة الدهون PBF',
      'rules.range': 'النطاق', 'rules.class': 'التصنيف', 'rules.points': 'النقاط',
      'rules.lt': 'أقل من {v}', 'rules.gt': 'أكثر من {v}', 'rules.gte': '{v} فأكثر', 'rules.between': 'من {a} إلى {b}', 'rules.betweenLt': 'من {a} إلى أقل من {b}',
      'rec.filterHint': 'تُطبق مرشحات التاريخ والجنس والفئة العمرية من قسم «التقارير» على هذه القائمة أيضًا.',
      'rec.title': 'السجلات الفردية', 'rec.search': 'بحث', 'rec.searchPh': 'بحث بالاسم أو الرقم أو رقم السجل',
      'rec.id': '#', 'rec.name': 'الاسم', 'rec.gender': 'الجنس', 'rec.age': 'العمر', 'rec.phone': 'رقم التواصل', 'rec.hr': 'النبض',
      'rec.hrClass': 'تصنيف النبض', 'rec.pbf': 'PBF', 'rec.pbfClass': 'تصنيف PBF', 'rec.points': 'النقاط', 'rec.bio': 'العمر التقديري',
      'rec.diff': 'الفارق', 'rec.date': 'التاريخ', 'rec.delete': 'حذف', 'rec.empty': 'لا توجد سجلات.',
      'rec.prev': 'السابق', 'rec.next': 'التالي', 'rec.page': 'صفحة {p} من {n} · {t} سجل',
      'rec.deleteConfirm': 'حذف السجل رقم {id} ({name}) نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.',
      'rec.deleted': 'تم حذف السجل.', 'rec.deleteFail': 'تعذر الحذف.', 'rec.loadFail': 'تعذر تحميل السجلات.',
      'purge.title': 'حذف السجلات القديمة',
      'purge.hint': 'تنفيذ سياسة الاحتفاظ بالبيانات: يحذف نهائيًا كل السجلات المنشأة قبل التاريخ المحدد. لا يمكن التراجع عن الحذف، ويُسجَّل في سجل التدقيق.',
      'purge.before': 'حذف السجلات قبل تاريخ', 'purge.submit': 'حذف نهائي',
      'purge.confirm': 'سيتم حذف جميع السجلات المنشأة قبل {date} نهائيًا. هل تريد المتابعة؟',
      'purge.done': 'تم حذف {n} من السجلات.', 'purge.none': 'لا توجد سجلات قبل هذا التاريخ.',
      'usr.title': 'حسابات الإدارة', 'usr.username': 'اسم المستخدم', 'usr.display': 'الاسم المعروض', 'usr.role': 'الدور',
      'usr.status': 'الحالة', 'usr.lastLogin': 'آخر دخول', 'usr.active': 'نشط', 'usr.inactive': 'معطّل', 'usr.you': ' (أنت)',
      'usr.toAnalyst': 'تحويل إلى محلل', 'usr.toAdmin': 'تحويل إلى مدير', 'usr.disable': 'تعطيل', 'usr.enable': 'تفعيل', 'usr.reset': 'إعادة تعيين كلمة المرور',
      'usr.roleConfirm': 'تغيير صلاحية {u} إلى «{r}»؟', 'usr.disableConfirm': 'تعطيل الحساب {u}؟ سيتم إنهاء جلساته فورًا.',
      'usr.resetPrompt': 'كلمة مرور جديدة للحساب {u} (12 حرفًا على الأقل):',
      'usr.saved': 'تم حفظ التغيير.', 'usr.saveFail': 'تعذر حفظ التغيير.', 'usr.loadFail': 'تعذر تحميل الحسابات.',
      'usr.add': 'إضافة حساب', 'usr.usernameHint': 'أحرف لاتينية أو أرقام أو (. _ -)',
      'usr.optAnalyst': 'محلل — تقارير مجمعة فقط', 'usr.optAdmin': 'مدير — صلاحية كاملة',
      'usr.tempPassword': 'كلمة المرور المؤقتة', 'usr.min12': '12 حرفًا على الأقل', 'usr.submit': 'إضافة الحساب',
      'usr.created': 'تم إنشاء الحساب.', 'usr.createFail': 'تعذر إنشاء الحساب.',
      'role.admin': 'مدير', 'role.analyst': 'محلل',
      'aud.title': 'سجل التدقيق', 'aud.sub': '(آخر 200 إجراء)', 'aud.date': 'التاريخ', 'aud.user': 'المستخدم', 'aud.action': 'الإجراء',
      'aud.details': 'التفاصيل', 'aud.ip': 'عنوان IP', 'aud.empty': 'لا توجد إجراءات.', 'aud.loadFail': 'تعذر تحميل سجل التدقيق.',
      'aud.yes': 'نعم', 'aud.no': 'لا',
      'act.login': 'تسجيل دخول', 'act.login_failed': 'محاولة دخول فاشلة', 'act.view_records': 'الاطلاع على السجلات',
      'act.export_stats': 'تصدير تقرير إحصائي', 'act.export_records': 'تصدير سجلات بدون بيانات شخصية',
      'act.export_records_pii': 'تصدير سجلات مع بيانات شخصية', 'act.delete_record': 'حذف سجل', 'act.purge_records': 'حذف جماعي للسجلات',
      'act.retention_purge': 'حذف تلقائي (مدة الاحتفاظ)', 'act.create_user': 'إنشاء حساب', 'act.update_user': 'تعديل حساب',
      'act.change_own_password': 'تغيير كلمة المرور',
      'det.id': 'رقم', 'det.username': 'المستخدم', 'det.role': 'الدور', 'det.active': 'نشط', 'det.passwordReset': 'إعادة تعيين كلمة المرور',
      'det.before': 'قبل تاريخ', 'det.deleted': 'المحذوف', 'det.count': 'العدد', 'det.page': 'الصفحة', 'det.q': 'بحث', 'det.cutoff': 'الحد', 'det.filter': 'المرشحات',
      'pw.title': 'تغيير كلمة المرور', 'pw.current': 'كلمة المرور الحالية', 'pw.new': 'كلمة المرور الجديدة',
      'pw.hint': '12 حرفًا على الأقل. سيتم إنهاء جلساتك على الأجهزة الأخرى.', 'pw.confirm': 'تأكيد كلمة المرور الجديدة',
      'pw.submit': 'حفظ كلمة المرور', 'pw.mismatch': 'كلمتا المرور الجديدتان غير متطابقتين.', 'pw.done': 'تم تغيير كلمة المرور بنجاح.',
      'pw.fail': 'تعذر تغيير كلمة المرور.',
      'stats.fail': 'تعذر تحميل الإحصاءات.',
    },

    en: {
      'brand.bae': 'BAE Systems',
      'brand.hayatna': 'Hayatona Clinics',
      'app.title': 'Biological Age',
      'lang.switch': 'العربية',
      'lang.short': 'ع',
      'lang.aria': 'Switch to Arabic',
      footer: 'BAE Systems × Hayatona Clinics',

      'form.pageTitle': 'Biological Age — Enter Your Data',
      'form.eyebrow': 'Physical Fitness Assessment',
      'form.heading': 'Calculate Your Biological Age',
      'form.intro': 'Enter your details and your two fitness test results to get an estimated biological age, a classification for each test, and general physical activity recommendations.',
      'form.basic': 'Basic Information',
      'form.tests': 'Fitness Test Results',
      'f.name': 'Name',
      'f.gender': 'Gender',
      'f.male': 'Male',
      'f.female': 'Female',
      'f.age': 'Age',
      'f.ageUnit': 'years',
      'f.ageHint': '18 years or older',
      'f.phone': 'Contact number',
      'f.hr': 'Heart rate after the step test',
      'f.hrUnit': 'bpm',
      'f.hrHint': 'After the 3-minute step test — whole number',
      'f.pbf': 'Body fat percentage (PBF)',
      'f.pbfHint': 'From the InBody device — decimals allowed (e.g. 23.5)',
      'form.submit': 'Submit Results',
      'form.submitting': 'Calculating…',
      'form.disclaimer': 'The result is <strong>an estimate calculated by this site’s formula</strong>, not a medical diagnosis. Your health data is kept confidential, and only authorised administrators can view individual records.',
      'v.required': 'This field is required.',
      'v.nameLength': 'Please enter a name between 2 and 100 characters.',
      'v.gender': 'Please select a gender.',
      'v.ageNumber': 'Please enter your age as a whole number of years.',
      'v.ageMin': 'Age must be 18 years or older.',
      'v.ageMax': 'Please check the age you entered.',
      'v.phone': 'Please enter a valid contact number (9 to 15 digits).',
      'v.hrNumber': 'Please enter the heart rate as a whole number.',
      'v.hrPositive': 'Heart rate must be greater than zero.',
      'v.pbfNumber': 'Please enter the body fat percentage as a number (decimals allowed).',
      'v.pbfRange': 'Body fat percentage must be between 0% and 100%.',
      'net.submit': 'Could not submit your data. Please try again.',
      'net.offline': 'Could not reach the server. Check your internet connection and try again.',

      'res.pageTitle': 'Biological Age — Result',
      'res.headerTitle': 'Biological Age Result',
      'res.loading': 'Loading your result…',
      'res.summary': 'Result summary',
      'res.chrono': 'Chronological age',
      'res.bio': 'Estimated biological age',
      'res.years': 'years',
      'res.diffSub': 'Difference between estimated biological age and chronological age',
      'res.younger': 'Your estimated biological age is {years} younger than your chronological age',
      'res.older': 'Your estimated biological age is {years} older than your chronological age',
      'res.equal': 'Your estimated biological age equals your chronological age',
      'res.hr': 'Heart rate after the step test',
      'res.pbf': 'Body fat percentage (PBF)',
      'res.recs': 'General Physical Activity Recommendations',
      'res.recsPersonal': 'Based on your results',
      'res.recsGeneral': 'WHO guidelines for adults',
      'res.disclaimer': 'This result is <strong>an estimate calculated by this site’s formula</strong>, not a medical diagnosis, and the recommendations are general guidance. Consult a doctor before starting a new exercise programme if you have a health condition or symptoms.',
      'res.print': 'Print / Save as PDF',
      'res.new': 'New assessment',
      'res.noneTitle': 'No result to display',
      'res.noneText': 'Please enter your details and test results first.',
      'res.missingTitle': 'Result unavailable',
      'res.missingText': 'This result link has expired or is invalid.',
      'res.failTitle': 'Could not load the result',
      'res.failText': 'Check your internet connection and reload the page.',
      'res.back': 'Back to the input page',

      'login.pageTitle': 'Admin Sign-in — Biological Age',
      'login.headerTitle': 'Admin Dashboard',
      'login.heading': 'Admin Sign-in',
      'login.hint': 'Authorised accounts only.',
      'login.username': 'Username',
      'login.password': 'Password',
      'login.submit': 'Sign in',
      'login.missing': 'Please enter your username and password.',
      'login.failed': 'Could not sign in.',
      'login.offline': 'Could not reach the server.',

      'adm.pageTitle': 'Admin Dashboard — Biological Age',
      'adm.headerTitle': 'Admin Dashboard — Biological Age',
      'adm.reportsTitle': 'Reports & Statistics',
      'adm.logout': 'Sign out',
      'adm.roleAdmin': 'Administrator (full access)',
      'adm.roleAnalyst': 'Analyst (aggregate reports only)',
      'nav.reports': 'Reports', 'nav.records': 'Records', 'nav.users': 'Accounts', 'nav.audit': 'Audit log', 'nav.account': 'My account',
      'flt.from': 'From', 'flt.to': 'To', 'flt.gender': 'Gender', 'flt.age': 'Age group', 'flt.all': 'All',
      'flt.apply': 'Apply', 'flt.reset': 'Clear', 'flt.aria': 'Report filters',
      'kpi.count': 'Assessments', 'kpi.points': 'Avg. total points', 'kpi.bio': 'Avg. estimated age', 'kpi.diff': 'Avg. difference',
      'kpi.avgAge': 'Avg. chronological age {n}', 'kpi.split': 'Younger {a} · Equal {b} · Older {c}',
      'dist.hr': 'Step test classification distribution', 'dist.pbf': 'Body fat (PBF) classification distribution', 'dist.points': 'Points {n}',
      'grp.title': 'Results by gender and age group', 'grp.gender': 'By gender', 'grp.age': 'By age group', 'grp.cross': 'Gender × age group',
      'col.gender': 'Gender', 'col.ageGroup': 'Age group', 'col.count': 'Count', 'col.avgPoints': 'Avg. points',
      'col.avgAge': 'Avg. chronological age', 'col.avgBio': 'Avg. estimated age', 'col.avgDiff': 'Avg. difference', 'col.split': 'Younger / Equal / Older',
      'tbl.empty': 'No data.',
      'exp.title': 'Export reports',
      'exp.hint': 'The current filters apply to exported files. Reports exclude names and contact numbers by default.',
      'exp.stats': 'Aggregate statistics (CSV)', 'exp.records': 'Records without personal data (CSV)', 'exp.pii': 'Records with names and contact numbers',
      'exp.piiConfirm': 'This file will include names and contact numbers (sensitive personal data), and this action will be logged. Continue?',
      'rules.title': 'Approved classification tables (from the database)', 'rules.hr': 'Heart rate after the step test', 'rules.pbf': 'Body fat percentage (PBF)',
      'rules.range': 'Range', 'rules.class': 'Classification', 'rules.points': 'Points',
      'rules.lt': 'Below {v}', 'rules.gt': 'Above {v}', 'rules.gte': '{v} and above', 'rules.between': '{a} to {b}', 'rules.betweenLt': '{a} to under {b}',
      'rec.filterHint': 'The date, gender and age group filters from the Reports section also apply to this list.',
      'rec.title': 'Individual records', 'rec.search': 'Search', 'rec.searchPh': 'Search by name, phone or record #',
      'rec.id': '#', 'rec.name': 'Name', 'rec.gender': 'Gender', 'rec.age': 'Age', 'rec.phone': 'Contact', 'rec.hr': 'Heart rate',
      'rec.hrClass': 'HR class', 'rec.pbf': 'PBF', 'rec.pbfClass': 'PBF class', 'rec.points': 'Points', 'rec.bio': 'Est. age',
      'rec.diff': 'Diff.', 'rec.date': 'Date', 'rec.delete': 'Delete', 'rec.empty': 'No records.',
      'rec.prev': 'Previous', 'rec.next': 'Next', 'rec.page': 'Page {p} of {n} · {t} records',
      'rec.deleteConfirm': 'Permanently delete record #{id} ({name})? This cannot be undone.',
      'rec.deleted': 'Record deleted.', 'rec.deleteFail': 'Could not delete.', 'rec.loadFail': 'Could not load records.',
      'purge.title': 'Delete old records',
      'purge.hint': 'Apply the data retention policy: permanently deletes every record created before the chosen date. This cannot be undone and is recorded in the audit log.',
      'purge.before': 'Delete records before', 'purge.submit': 'Delete permanently',
      'purge.confirm': 'All records created before {date} will be permanently deleted. Continue?',
      'purge.done': '{n} records deleted.', 'purge.none': 'There are no records before this date.',
      'usr.title': 'Admin accounts', 'usr.username': 'Username', 'usr.display': 'Display name', 'usr.role': 'Role',
      'usr.status': 'Status', 'usr.lastLogin': 'Last sign-in', 'usr.active': 'Active', 'usr.inactive': 'Disabled', 'usr.you': ' (you)',
      'usr.toAnalyst': 'Make analyst', 'usr.toAdmin': 'Make administrator', 'usr.disable': 'Disable', 'usr.enable': 'Enable', 'usr.reset': 'Reset password',
      'usr.roleConfirm': 'Change {u}’s role to “{r}”?', 'usr.disableConfirm': 'Disable account {u}? Their sessions will end immediately.',
      'usr.resetPrompt': 'New password for {u} (at least 12 characters):',
      'usr.saved': 'Change saved.', 'usr.saveFail': 'Could not save the change.', 'usr.loadFail': 'Could not load accounts.',
      'usr.add': 'Add account', 'usr.usernameHint': 'Latin letters, digits or (. _ -)',
      'usr.optAnalyst': 'Analyst — aggregate reports only', 'usr.optAdmin': 'Administrator — full access',
      'usr.tempPassword': 'Temporary password', 'usr.min12': 'At least 12 characters', 'usr.submit': 'Add account',
      'usr.created': 'Account created.', 'usr.createFail': 'Could not create the account.',
      'role.admin': 'Administrator', 'role.analyst': 'Analyst',
      'aud.title': 'Audit log', 'aud.sub': '(last 200 actions)', 'aud.date': 'Date', 'aud.user': 'User', 'aud.action': 'Action',
      'aud.details': 'Details', 'aud.ip': 'IP address', 'aud.empty': 'No actions.', 'aud.loadFail': 'Could not load the audit log.',
      'aud.yes': 'Yes', 'aud.no': 'No',
      'act.login': 'Sign-in', 'act.login_failed': 'Failed sign-in', 'act.view_records': 'Viewed records',
      'act.export_stats': 'Exported aggregate report', 'act.export_records': 'Exported records (no personal data)',
      'act.export_records_pii': 'Exported records with personal data', 'act.delete_record': 'Deleted a record', 'act.purge_records': 'Bulk-deleted records',
      'act.retention_purge': 'Automatic deletion (retention)', 'act.create_user': 'Created an account', 'act.update_user': 'Updated an account',
      'act.change_own_password': 'Changed own password',
      'det.id': 'ID', 'det.username': 'User', 'det.role': 'Role', 'det.active': 'Active', 'det.passwordReset': 'Password reset',
      'det.before': 'Before', 'det.deleted': 'Deleted', 'det.count': 'Count', 'det.page': 'Page', 'det.q': 'Search', 'det.cutoff': 'Cutoff', 'det.filter': 'Filters',
      'pw.title': 'Change password', 'pw.current': 'Current password', 'pw.new': 'New password',
      'pw.hint': 'At least 12 characters. Your sessions on other devices will be signed out.', 'pw.confirm': 'Confirm new password',
      'pw.submit': 'Save password', 'pw.mismatch': 'The new passwords do not match.', 'pw.done': 'Password changed successfully.',
      'pw.fail': 'Could not change the password.',
      'stats.fail': 'Could not load statistics.',
    },
  };

  const KEY = 'ba-lang';
  let lang = 'ar';
  try { lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'ar'; } catch { /* التخزين غير متاح */ }

  function setDocLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  }
  setDocLang();

  function t(key, vars) {
    let s = STRINGS[lang][key];
    if (s === undefined) s = STRINGS.ar[key];
    if (s === undefined) return key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.split(`{${k}}`).join(String(v)); });
    return s;
  }

  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    root.querySelectorAll('[data-i18n-alt]').forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    const titleKey = document.documentElement.dataset.titleKey;
    if (titleKey) document.title = t(titleKey);
  }

  function set(next) {
    lang = next === 'en' ? 'en' : 'ar';
    try { localStorage.setItem(KEY, lang); } catch { /* التخزين غير متاح */ }
    setDocLang();
    apply();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  /** «سنة» بالصيغة الصحيحة بحسب العدد واللغة */
  function years(n) {
    const a = Math.abs(n);
    if (lang === 'en') return a === 1 ? '1 year' : `${a} years`;
    if (a === 1) return 'سنة واحدة';
    if (a === 2) return 'سنتان';
    if (a >= 3 && a <= 10) return `${a} سنوات`;
    return `${a} سنة`;
  }

  function dateLocale() {
    return lang === 'en' ? 'en-GB' : 'ar-SA-u-nu-latn-ca-gregory';
  }

  window.I18N = {
    t, apply, set, years, dateLocale,
    get lang() { return lang; },
    toggle() { set(lang === 'en' ? 'ar' : 'en'); },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => apply());
  else apply();
})();
