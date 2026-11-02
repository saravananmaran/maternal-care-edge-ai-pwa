/**
 * Clinical preset scenarios for field testing and rural worker demonstrations.
 */
export const CLINICAL_PRESETS = [
  {
    id: 'preeclampsia_crisis',
    label: 'High Risk: Impending Eclampsia / Crisis',
    tag: 'High Risk',
    color: 'red',
    data: {
      fullName: 'Sunita Devi',
      villageId: 'VIL-EAST-12',
      age: 26,
      gestationalAge: 34,
      gravida: 2,
      parity: 1,
      systolicBP: 168,
      diastolicBP: 112,
      heartRate: 98,
      bloodGlucose: 105,
      bodyTemp: 98.6,
      symptoms: ['severe_headache', 'blurred_vision', 'epigastric_pain', 'severe_swelling'],
      notes: 'Complains of intense throbbing frontal headache for 12 hours with epigastric discomfort.'
    }
  },
  {
    id: 'gestational_diabetes',
    label: 'Moderate Risk: Gestational Diabetes & Mild HTN',
    tag: 'Moderate',
    color: 'amber',
    data: {
      fullName: 'Fatima Begum',
      villageId: 'VIL-WEST-04',
      age: 33,
      gestationalAge: 28,
      gravida: 3,
      parity: 2,
      systolicBP: 142,
      diastolicBP: 92,
      heartRate: 88,
      bloodGlucose: 184,
      bodyTemp: 98.4,
      symptoms: ['severe_swelling'],
      notes: 'Random blood glucose elevated. Mild pedal edema noted.'
    }
  },
  {
    id: 'healthy_antenatal',
    label: 'Low Risk: Normal Routine Antenatal Checkup',
    tag: 'Low Risk',
    color: 'emerald',
    data: {
      fullName: 'Amina Patel',
      villageId: 'VIL-SOUTH-09',
      age: 23,
      gestationalAge: 20,
      gravida: 1,
      parity: 0,
      systolicBP: 112,
      diastolicBP: 72,
      heartRate: 76,
      bloodGlucose: 88,
      bodyTemp: 98.2,
      symptoms: [],
      notes: 'Second trimester routine visit. Active fetal movement reported.'
    }
  },
  {
    id: 'hemorrhage_emergency',
    label: 'High Risk: Vaginal Bleeding & Tachycardia',
    tag: 'Emergency',
    color: 'red',
    data: {
      fullName: 'Kavita Sharma',
      villageId: 'VIL-NORTH-07',
      age: 29,
      gestationalAge: 36,
      gravida: 4,
      parity: 3,
      systolicBP: 94,
      diastolicBP: 58,
      heartRate: 126,
      bloodGlucose: 95,
      bodyTemp: 99.1,
      symptoms: ['vaginal_bleeding', 'reduced_fetal_movement'],
      notes: 'Sudden onset of bright red vaginal bleeding. Tachycardia and mild hypotension.'
    }
  }
]

