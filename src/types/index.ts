export interface Answer {
  type: 'address' | 'phone' | 'budget' | 'allergy' | 'preference' | 'foodType' | 'payment';
  value: string;
}

export interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  location?: {
    lat: number;
    lng: number;
  };
}

export interface CompletedAnswers {
  [key: number]: Answer;
}

export interface StepContent {
  message: string;
  showAddressInput?: boolean;
  showPhoneInput?: boolean;
  showBudgetInput?: boolean;
  showAllergyInput?: boolean;
  showPreferenceInput?: boolean;
  showFoodTypeInput?: boolean;
  showCompleted?: boolean;
  showPayment?: boolean;
  inputType: 'address' | 'phone' | 'budget' | 'allergy' | 'preference' | 'foodType' | 'completed' | 'payment';
}

export interface AuthResult {
  success: boolean;
  isNewUser: boolean;
  userId?: string;
  phoneNumber: string;
  message?: string;
}

export interface InputFocus {
  address: boolean;
  phone: boolean;
  budget: boolean;
  allergies: boolean;
  preferences: boolean;
}

export interface LabelAnimations {
  address: any;
  phone: any;
  budget: any;
  allergies: any;
  preferences: any;
}

export interface ThemeColor {
  r: number;
  g: number;
  b: number;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}