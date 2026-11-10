'use strict';

/**
 * توصيات توعوية عامة للنشاط البدني — لا تُستخدم للتشخيص.
 * التوصية الأساسية مستندة إلى إرشادات منظمة الصحة العالمية للبالغين.
 */

const GENERAL = {
  ar: [
    {
      title: 'النشاط الهوائي الأسبوعي',
      text: 'توصي منظمة الصحة العالمية البالغين بممارسة 150–300 دقيقة أسبوعيًا من النشاط الهوائي متوسط الشدة (مثل المشي السريع)، أو 75–150 دقيقة من النشاط الشديد، أو مزيج يعادلهما.',
    },
    {
      title: 'تقوية العضلات',
      text: 'مارس تمارين تقوية العضلات متوسطة الشدة أو أعلى، تشمل المجموعات العضلية الرئيسية، يومين أو أكثر أسبوعيًا.',
    },
    {
      title: 'البدء التدريجي',
      text: 'إذا كنت قليل النشاط فابدأ بكميات صغيرة وزِدها تدريجيًا في المدة والتكرار والشدة؛ فأي قدر من النشاط أفضل من عدمه، مع تقليل فترات الجلوس الطويلة.',
    },
  ],
  en: [
    {
      title: 'Weekly aerobic activity',
      text: 'The World Health Organization recommends that adults do 150–300 minutes of moderate-intensity aerobic activity per week (such as brisk walking), or 75–150 minutes of vigorous activity, or an equivalent combination.',
    },
    {
      title: 'Muscle strengthening',
      text: 'Do moderate- or higher-intensity muscle-strengthening exercises that involve all major muscle groups on two or more days a week.',
    },
    {
      title: 'Start gradually',
      text: 'If you are currently inactive, start with small amounts and gradually increase duration, frequency and intensity. Some activity is better than none, and limit long periods of sitting.',
    },
  ],
};

const BY_HR = {
  hr_pro: {
    ar: 'لياقتك القلبية التنفسية مرتفعة جدًا؛ حافظ على تدريبك الهوائي المنتظم، ونوّع التمارين، وامنح جسمك وقتًا كافيًا للاستشفاء.',
    en: 'Your cardiorespiratory fitness is very high. Keep up regular aerobic training, vary your workouts and allow enough time for recovery.',
  },
  hr_excellent: {
    ar: 'لياقتك القلبية التنفسية ممتازة؛ استمر على نشاطك الهوائي المنتظم وأضف حصصًا متنوعة للحفاظ على هذا المستوى.',
    en: 'Your cardiorespiratory fitness is excellent. Continue your regular aerobic activity and add variety to maintain this level.',
  },
  hr_very_good: {
    ar: 'مستوى لياقتك القلبية جيد جدًا؛ يمكنك تحسينه بإضافة حصة أسبوعية من التمارين المتقطعة عالية الشدة بشكل تدريجي.',
    en: 'Your cardio fitness is very good. You can improve it further by gradually adding one weekly session of high-intensity interval training.',
  },
  hr_good: {
    ar: 'مستوى لياقتك القلبية جيد؛ حاول الوصول إلى 150 دقيقة أسبوعيًا على الأقل من النشاط الهوائي متوسط الشدة ثم زِدها تدريجيًا.',
    en: 'Your cardio fitness is good. Aim for at least 150 minutes a week of moderate-intensity aerobic activity, then increase gradually.',
  },
  hr_average: {
    ar: 'لتحسين لياقتك القلبية، خصّص 30 دقيقة من المشي السريع أو ركوب الدراجة في معظم أيام الأسبوع، وزِد الشدة تدريجيًا.',
    en: 'To improve your cardio fitness, set aside 30 minutes of brisk walking or cycling on most days of the week and gradually increase the intensity.',
  },
  hr_below_avg: {
    ar: 'يُنصح ببرنامج هوائي تدريجي يبدأ بـ 15–20 دقيقة من النشاط متوسط الشدة، مع زيادة المدة أسبوعيًا حتى تبلغ 150 دقيقة أسبوعيًا.',
    en: 'A gradual aerobic programme is recommended: start with 15–20 minutes of moderate activity and increase the duration each week until you reach 150 minutes per week.',
  },
  hr_weak: {
    ar: 'ابدأ بنشاط خفيف إلى متوسط الشدة كالمشي، وزِده تدريجيًا، واستشر الطبيب قبل البدء ببرنامج رياضي مكثف.',
    en: 'Start with light-to-moderate activity such as walking and build up gradually. Consult a doctor before starting an intensive exercise programme.',
  },
  hr_poor: {
    ar: 'يُنصح بمراجعة الطبيب قبل البدء ببرنامج رياضي، ثم البدء بنشاط خفيف مثل المشي القصير وزيادته تدريجيًا وبإشراف مختص إن أمكن.',
    en: 'Please see a doctor before starting an exercise programme, then begin with light activity such as short walks and increase gradually, under professional supervision if possible.',
  },
};

const BY_PBF = {
  pbf_essential: {
    ar: 'نسبة الدهون لديك قريبة من الحد الأساسي الضروري للجسم؛ احرص على تغذية متوازنة وكافية، ويُفضّل مراجعة أخصائي تغذية.',
    en: 'Your body fat is close to the essential minimum the body needs. Make sure your diet is balanced and sufficient; seeing a dietitian is advisable.',
  },
  pbf_athlete: {
    ar: 'نسبة الدهون ضمن الفئة الرياضية؛ حافظ على توازن التغذية وتمارين القوة والنشاط الهوائي.',
    en: 'Your body fat is in the athletic range. Maintain a balance of nutrition, strength training and aerobic activity.',
  },
  pbf_fitness: {
    ar: 'نسبة الدهون ضمن فئة اللياقة العالية؛ استمر على نشاطك البدني المنتظم ونظامك الغذائي المتوازن.',
    en: 'Your body fat is in the high-fitness range. Keep up your regular physical activity and balanced diet.',
  },
  pbf_normal: {
    ar: 'نسبة الدهون ضمن الفئة المقبولة؛ يساعد الجمع بين تمارين المقاومة والنشاط الهوائي على تحسين تركيب الجسم.',
    en: 'Your body fat is in the acceptable range. Combining resistance training with aerobic activity helps improve body composition.',
  },
  pbf_overfat: {
    ar: 'اجمع بين النشاط الهوائي المنتظم وتمارين المقاومة يومين أو أكثر أسبوعيًا، وقلّل فترات الجلوس، ويُفضّل استشارة أخصائي تغذية.',
    en: 'Combine regular aerobic activity with resistance training on two or more days a week, reduce sitting time, and consider consulting a dietitian.',
  },
  pbf_obese: {
    ar: 'يُنصح بمراجعة الطبيب أو أخصائي التغذية لوضع خطة مناسبة، مع البدء بنشاط بدني تدريجي منخفض التأثير على المفاصل كالمشي أو السباحة.',
    en: 'Consider seeing a doctor or dietitian to create a suitable plan, and start gradual, low-impact activity such as walking or swimming.',
  },
};

const TITLES = {
  ar: { hr: 'اللياقة القلبية التنفسية', pbf: 'نسبة الدهون في الجسم' },
  en: { hr: 'Cardiorespiratory fitness', pbf: 'Body fat percentage' },
};

function buildRecommendations(hrCode, pbfCode, lang = 'ar') {
  const L = lang === 'en' ? 'en' : 'ar';
  const personal = [];
  if (BY_HR[hrCode]) personal.push({ title: TITLES[L].hr, text: BY_HR[hrCode][L] });
  if (BY_PBF[pbfCode]) personal.push({ title: TITLES[L].pbf, text: BY_PBF[pbfCode][L] });
  return { personal, general: GENERAL[L] };
}

module.exports = { buildRecommendations };
