'use strict';

/**
 * ترجمة رسائل الخادم (العربية والإنجليزية).
 * تُحدَّد اللغة من الترويسة X-Lang أو المعامل ?lang= (الافتراضي: العربية).
 */

const LANGS = ['ar', 'en'];

const MESSAGES = {
  ar: {
    // التحقق من المدخلات
    'v.required': 'هذا الحقل مطلوب.',
    'v.nameLength': 'يرجى إدخال اسم بين حرفين و100 حرف.',
    'v.gender': 'يرجى اختيار الجنس.',
    'v.ageNumber': 'يرجى إدخال العمر رقمًا صحيحًا بالسنوات.',
    'v.ageMin': 'يجب أن يكون العمر 18 سنة فأكثر.',
    'v.ageMax': 'يرجى التأكد من العمر المدخل.',
    'v.phone': 'يرجى إدخال رقم تواصل صحيح (من 9 إلى 15 رقمًا).',
    'v.hrNumber': 'يرجى إدخال النبض عددًا صحيحًا بدون كسور.',
    'v.hrPositive': 'يجب أن يكون النبض أكبر من صفر.',
    'v.hrMax': 'قيمة النبض غير منطقية. يرجى التأكد من القراءة.',
    'v.pbfNumber': 'يرجى إدخال نسبة الدهون رقمًا (تُقبل الكسور العشرية).',
    'v.pbfRange': 'يجب أن تكون نسبة الدهون بين 0% و100%.',
    'v.outOfRange': 'القيمة خارج نطاق التصنيف المعتمد. يرجى مراجعة قراءة الجهاز أو التأكد من إدخالها.',

    // أخطاء عامة
    'e.fixFields': 'يرجى تصحيح الحقول المشار إليها.',
    'e.rateLimit': 'عدد كبير من المحاولات. يرجى المحاولة بعد قليل.',
    'e.loginRate': 'محاولات دخول كثيرة. يرجى المحاولة بعد 15 دقيقة.',
    'e.resultMissing': 'انتهت صلاحية رابط النتيجة أو أنه غير صحيح.',
    'e.forbiddenRequest': 'طلب غير مسموح.',
    'e.contentType': 'نوع المحتوى غير مدعوم.',
    'e.notFound': 'غير موجود.',
    'e.badData': 'بيانات غير صالحة.',
    'e.tooLarge': 'حجم البيانات كبير.',
    'e.server': 'حدث خطأ غير متوقع. يرجى المحاولة لاحقًا.',
    'e.login': 'اسم المستخدم أو كلمة المرور غير صحيحة.',
    'e.loginRequired': 'يرجى تسجيل الدخول.',
    'e.sessionExpired': 'انتهت الجلسة. يرجى تسجيل الدخول مجددًا.',
    'e.forbidden': 'لا تملك صلاحية الوصول إلى هذه البيانات.',
    'e.piiForbidden': 'لا تملك صلاحية تصدير البيانات الشخصية.',
    'e.badId': 'رقم سجل غير صالح.',
    'e.recordMissing': 'السجل غير موجود.',
    'e.badDate': 'يرجى تحديد تاريخ صحيح.',
    'e.currentPassword': 'كلمة المرور الحالية غير صحيحة.',
    'e.passwordLength': 'يجب ألا تقل كلمة المرور عن {n} حرفًا.',
    'e.username': 'اسم المستخدم: 3–40 حرفًا لاتينيًا أو أرقامًا أو (. _ -).',
    'e.role': 'دور غير صالح.',
    'e.displayName': 'الاسم المعروض طويل جدًا.',
    'e.usernameTaken': 'اسم المستخدم مستخدم مسبقًا.',
    'e.userMissing': 'الحساب غير موجود.',
    'e.noChanges': 'لا توجد تغييرات.',
    'e.selfChange': 'لا يمكنك تعطيل حسابك أو خفض صلاحيته بنفسك.',
    'e.lastAdmin': 'يجب أن يبقى حساب مدير نشط واحد على الأقل.',

    gender_male: 'ذكر',
    gender_female: 'أنثى',

    // ملف CSV
    'csv.title': 'تقرير العمر البيولوجي — إحصاءات مجمعة',
    'csv.from': 'من تاريخ', 'csv.to': 'إلى تاريخ',
    'csv.summary': 'الملخص العام', 'csv.all': 'جميع التقييمات',
    'csv.group': 'المجموعة', 'csv.count': 'عدد التقييمات', 'csv.avgPoints': 'متوسط النقاط',
    'csv.avgAge': 'متوسط العمر الزمني', 'csv.avgBio': 'متوسط العمر التقديري', 'csv.avgDiff': 'متوسط الفارق',
    'csv.younger': 'أصغر من العمر الزمني', 'csv.same': 'مساوٍ', 'csv.older': 'أكبر من العمر الزمني',
    'csv.hrDist': 'توزيع تصنيفات اختبار الخطوة', 'csv.pbfDist': 'توزيع تصنيفات نسبة الدهون PBF',
    'csv.class': 'التصنيف', 'csv.points': 'النقاط', 'csv.n': 'العدد',
    'csv.byGender': 'حسب الجنس', 'csv.byAge': 'حسب الفئة العمرية', 'csv.byCross': 'حسب الجنس والفئة العمرية',
    'csv.id': 'رقم السجل', 'csv.name': 'الاسم', 'csv.phone': 'رقم التواصل', 'csv.gender': 'الجنس',
    'csv.age': 'العمر', 'csv.ageGroup': 'الفئة العمرية', 'csv.hr': 'النبض', 'csv.hrClass': 'تصنيف النبض',
    'csv.hrPoints': 'نقاط النبض', 'csv.pbf': 'PBF %', 'csv.pbfClass': 'تصنيف PBF', 'csv.pbfPoints': 'نقاط PBF',
    'csv.total': 'مجموع النقاط', 'csv.bio': 'العمر التقديري', 'csv.diff': 'الفارق',
    'csv.date': 'تاريخ ووقت التقييم (UTC)',
  },

  en: {
    'v.required': 'This field is required.',
    'v.nameLength': 'Please enter a name between 2 and 100 characters.',
    'v.gender': 'Please select a gender.',
    'v.ageNumber': 'Please enter your age as a whole number of years.',
    'v.ageMin': 'Age must be 18 years or older.',
    'v.ageMax': 'Please check the age you entered.',
    'v.phone': 'Please enter a valid contact number (9 to 15 digits).',
    'v.hrNumber': 'Please enter the heart rate as a whole number.',
    'v.hrPositive': 'Heart rate must be greater than zero.',
    'v.hrMax': 'This heart rate is not plausible. Please check the reading.',
    'v.pbfNumber': 'Please enter the body fat percentage as a number (decimals allowed).',
    'v.pbfRange': 'Body fat percentage must be between 0% and 100%.',
    'v.outOfRange': 'The value is outside the approved classification range. Please check the device reading or your entry.',

    'e.fixFields': 'Please correct the highlighted fields.',
    'e.rateLimit': 'Too many attempts. Please try again shortly.',
    'e.loginRate': 'Too many login attempts. Please try again in 15 minutes.',
    'e.resultMissing': 'This result link has expired or is invalid.',
    'e.forbiddenRequest': 'Request not allowed.',
    'e.contentType': 'Unsupported content type.',
    'e.notFound': 'Not found.',
    'e.badData': 'Invalid data.',
    'e.tooLarge': 'Request is too large.',
    'e.server': 'An unexpected error occurred. Please try again later.',
    'e.login': 'Incorrect username or password.',
    'e.loginRequired': 'Please sign in.',
    'e.sessionExpired': 'Your session has expired. Please sign in again.',
    'e.forbidden': 'You do not have permission to access this data.',
    'e.piiForbidden': 'You do not have permission to export personal data.',
    'e.badId': 'Invalid record number.',
    'e.recordMissing': 'Record not found.',
    'e.badDate': 'Please choose a valid date.',
    'e.currentPassword': 'The current password is incorrect.',
    'e.passwordLength': 'Password must be at least {n} characters.',
    'e.username': 'Username: 3–40 Latin letters, digits or (. _ -).',
    'e.role': 'Invalid role.',
    'e.displayName': 'Display name is too long.',
    'e.usernameTaken': 'This username is already taken.',
    'e.userMissing': 'Account not found.',
    'e.noChanges': 'No changes to save.',
    'e.selfChange': 'You cannot deactivate or downgrade your own account.',
    'e.lastAdmin': 'At least one active administrator account must remain.',

    gender_male: 'Male',
    gender_female: 'Female',

    'csv.title': 'Biological Age Report — Aggregate Statistics',
    'csv.from': 'From', 'csv.to': 'To',
    'csv.summary': 'Overall summary', 'csv.all': 'All assessments',
    'csv.group': 'Group', 'csv.count': 'Assessments', 'csv.avgPoints': 'Avg. points',
    'csv.avgAge': 'Avg. chronological age', 'csv.avgBio': 'Avg. estimated age', 'csv.avgDiff': 'Avg. difference',
    'csv.younger': 'Younger than chronological', 'csv.same': 'Equal', 'csv.older': 'Older than chronological',
    'csv.hrDist': 'Step test classification distribution', 'csv.pbfDist': 'Body fat (PBF) classification distribution',
    'csv.class': 'Classification', 'csv.points': 'Points', 'csv.n': 'Count',
    'csv.byGender': 'By gender', 'csv.byAge': 'By age group', 'csv.byCross': 'By gender and age group',
    'csv.id': 'Record #', 'csv.name': 'Name', 'csv.phone': 'Contact number', 'csv.gender': 'Gender',
    'csv.age': 'Age', 'csv.ageGroup': 'Age group', 'csv.hr': 'Heart rate', 'csv.hrClass': 'Heart rate class',
    'csv.hrPoints': 'Heart rate points', 'csv.pbf': 'PBF %', 'csv.pbfClass': 'PBF class', 'csv.pbfPoints': 'PBF points',
    'csv.total': 'Total points', 'csv.bio': 'Estimated age', 'csv.diff': 'Difference',
    'csv.date': 'Assessment date/time (UTC)',
  },
};

function getLang(req) {
  const raw = String(req.get('x-lang') || req.query.lang || '').toLowerCase().slice(0, 2);
  return LANGS.includes(raw) ? raw : 'ar';
}

function t(lang, key, vars) {
  let s = (MESSAGES[lang] && MESSAGES[lang][key]) || MESSAGES.ar[key] || key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

/** يرسل استجابة خطأ مترجمة: fail(res, 400, 'e.badId') */
function fail(req, res, status, key, vars) {
  return res.status(status).json({ error: t(getLang(req), key, vars) });
}

module.exports = { getLang, t, fail, LANGS };
