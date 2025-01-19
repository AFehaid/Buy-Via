// src/contexts/LanguageContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define available languages
export const LANGUAGES = {
    EN: 'en',
    AR: 'ar'
};

// Translations object
const translations = {
    [LANGUAGES.EN]: {
        // Navigation
        navigation: {
            home: 'Home',
            deals: 'Deals',
            newArrivals: 'New Arrivals',
            search: 'Search',
            categories: 'Categories',
            profile: 'Profile',
            alerts: 'Alerts',
            settings: 'Settings'
        },
        // Auth
        auth: {
            welcome: "Welcome to Buy Via",
            subtitle: "Your ultimate AI-driven price comparison platform",
            login: "Sign In",
            signup: "Sign Up",
            usernamePlaceholder: "Username",
            emailPlaceholder: "Email",
            passwordPlaceholder: "Password",
            confirmPasswordPlaceholder: "Confirm Password",
            loginSuccess: "Logged in successfully!",
            registrationSuccess: "Account created successfully! Please sign in.",
            passwordsMismatch: "Passwords do not match.",
            registrationFailed: "Registration failed. Please try again.",
            generalError: "An error occurred. Please try again."
        },
        // Filters
        filters: {
            title: 'Filters',
            sortBy: 'Sort By',
            priceRange: 'Price Range',
            stores: 'Stores',
            categories: 'Categories',
            allStores: 'All Stores',
            relevance: 'Relevance',
            priceLowToHigh: 'Price: Low to High',
            priceHighToLow: 'Price: High to Low',
            newest: 'Newest First'
        },
        // Product
        product: {
            outOfStock: 'Out of Stock',
            inStock: 'In Stock',
            addToCart: 'Add to Cart',
            description: 'Description',
            specifications: 'Specifications',
            reviews: 'Reviews',
            priceAlert: 'Set Price Alert',
            share: 'Share',
            setAlert: 'Alert at',
            buy:'Buy',
            notAvailable: 'not available',
            defaultDescription: 'This product offers a great combination of quality and value, designed to meet your needs. Suitable for various applications, it ensures durability and performance. For more details, please refer to the specifications or contact the seller.'
        },
        // Common
        common: {
            loading: 'Loading...',
            error: 'An error occurred',
            retry: 'Retry',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            apply: 'Apply',
            clear: 'Clear',
            search: 'Search',
            noResults: 'No results found',
            showMore: 'Show More',
            errorLoading: 'Failed to load products. Please try again later.',
            priceNotAvailable: 'Price not available',
            off: 'OFF',
            category: 'Category',
            via:'Via'
        },
        alerts: {
            title: "Price Alerts",
            signInRequired: "Please sign in to view and manage your price alerts",
            myAlerts: "My Alerts",
            currentPrice: "Current Price",
            alertPrice: "Alert Price",
            newThreshold: "Target Price",
            editAlert: "Edit Alert",
            removeAlert: "Remove Alert",
            product: "Product",
            noAlerts: "You don't have any price alerts set up yet",
            browseProducts: "Browse Products",
            removeAlertTitle: "Remove Price Alert",
            removeAlertConfirm: "Are you sure you want to remove this alert? You won't receive notifications for this product anymore",
            remove: "Remove",
            setPriceAlert: "Set Price Alert",
            thresholdPrice: "Target Price",
            setAlert: "Set Alert",
            alertCreated: "Price alert created successfully!",
            alertRemoved: "Price alert removed successfully",
            removeSuccess: "Price alert removed successfully",
            invalidInput: "Invalid price or product information",
            serverError: "Unable to create alert. Please try again.",
            removeAlertConfirm: "Are you sure you want to remove this price alert? You won't receive notifications for this product anymore.",
            removeAlert: "Remove Price Alert",
            remove: "Yes, Remove Alert"
            
        },
        footer: {
            aboutUs: "About Us",
            aboutText: "We are a leading e-commerce platform dedicated to providing the best prices for our customers.",
            quickLinks: "Quick Links",
            contactUs: "Contact Us",
            followUs: "Follow Us",
            facebook: "Facebook",
            twitter: "Twitter",
            instagram: "Instagram",
            contactInfo: "Contact Info",
            email: "Email: support@example.com",
            phone: "Phone: Example",
            address: "Address: Example",
            rights: "All rights reserved."
        },
        search: {
            resultsFor: 'Search Results for "{{query}}"',
            noResults: 'No products found for "{query}"',
            allProducts: 'All Products',
            showing: 'Showing {{shown}} of {{total}} results'
          }
    },
    [LANGUAGES.AR]: {
        // Navigation
        navigation: {
            home: 'الرئيسية',
            deals: 'العروض',
            newArrivals: 'وصل حديثاً',
            search: 'بحث',
            categories: 'الفئات',
            profile: 'الملف الشخصي',
            alerts: 'التنبيهات',
            settings: 'الإعدادات'
        },
        // Auth
        auth: {
            login: 'تسجيل الدخول',
            signup: 'إنشاء حساب',
            logout: 'تسجيل الخروج',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            forgotPassword: 'نسيت كلمة المرور؟',
            rememberMe: 'تذكرني',  
            welcome: "مرحباً بك في Buy Via",
            subtitle: "منصتك المتكاملة لمقارنة الأسعار المدعومة بالذكاء الاصطناعي",
            usernamePlaceholder: "اسم المستخدم",
            emailPlaceholder: "البريد الإلكتروني",
            passwordPlaceholder: "كلمة المرور",
            confirmPasswordPlaceholder: "تأكيد كلمة المرور",
            loginSuccess: "تم تسجيل الدخول بنجاح!",
            registrationSuccess: "تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.",
            passwordsMismatch: "كلمات المرور غير متطابقة.",
            registrationFailed: "فشل التسجيل. يرجى المحاولة مرة أخرى.",
            generalError: "حدث خطأ. يرجى المحاولة مرة أخرى."
            
        },
        // Filters
        filters: {
            title: 'التصفية',
            sortBy: 'ترتيب حسب',
            priceRange: 'نطاق السعر',
            stores: 'المتاجر',
            categories: 'الفئات',
            allStores: 'جميع المتاجر',
            relevance: 'الأكثر صلة',
            priceLowToHigh: 'السعر: من الأقل إلى الأعلى',
            priceHighToLow: 'السعر: من الأعلى إلى الأقل',
            newest: 'الأحدث أولاً'
        },
        alerts: {
            title: "تنبيهات الأسعار",
            signInRequired: "يرجى تسجيل الدخول لعرض وإدارة تنبيهات الأسعار",
            myAlerts: "تنبيهاتي",
            currentPrice: "السعر الحالي",
            alertPrice: "سعر التنبيه",
            newThreshold: "السعر المستهدف",
            editAlert: "تعديل التنبيه",
            removeAlert: "حذف التنبيه",
            product: "منتج",
            noAlerts: "لا توجد لديك تنبيهات أسعار حتى الآن",
            browseProducts: "تصفح المنتجات",
            removeAlertTitle: "حذف تنبيه السعر",
            removeAlertConfirm: "هل أنت متأكد من حذف هذا التنبيه؟ لن تتلقى إشعارات لهذا المنتج بعد الآن",
            remove: "حذف",
            setPriceAlert: "تعيين تنبيه السعر",
            thresholdPrice: "السعر المستهدف",
            setAlert: "تعيين التنبيه",
            alertCreated: "تم إنشاء تنبيه السعر بنجاح!",
            alertRemoved: "تم إزالة تنبيه السعر بنجاح",
            invalidInput: "سعر أو معلومات المنتج غير صالحة",
            serverError: "تعذر إنشاء التنبيه. حاول مرة اخرى.",
            removeSuccess: "تم إزالة تنبيه السعر بنجاح",
            serverError: "تعذر إنشاء التنبيه. يرجى المحاولة مرة أخرى.",
            removeAlertConfirm: "هل أنت متأكد من إزالة تنبيه السعر هذا؟ لن تتلقى إشعارات لهذا المنتج بعد الآن.",
            removeAlert: "إزالة تنبيه السعر",
            remove: "نعم، إزالة التنبيه"
          },
        // Product
        product: {
            outOfStock: 'غير متوفر',
            inStock: 'متوفر',
            addToCart: 'أضف إلى السلة',
            description: 'الوصف',
            specifications: 'المواصفات',
            reviews: 'التقييمات',
            priceAlert: 'تنبيه السعر',
            share: 'مشاركة',
            setAlert: 'التنبيه عند',
            buy:'إشتر',
            notAvailable: 'غير متوفر',
            defaultDescription: 'يقدم هذا المنتج مزيجًا رائعًا من الجودة والقيمة، وهو مصمم لتلبية احتياجاتك. مناسب لتطبيقات مختلفة، ويضمن المتانة والأداء. لمزيد من التفاصيل، يرجى الرجوع إلى المواصفات أو الاتصال بالبائع.'
        },
        // Common
        common: {
            loading: 'جاري التحميل...',
            error: 'حدث خطأ',
            retry: 'إعادة المحاولة',
            save: 'حفظ',
            cancel: 'إلغاء',
            delete: 'حذف',
            edit: 'تعديل',
            apply: 'تطبيق',
            clear: 'مسح',
            errorLoading: 'فشل تحميل المنتجات. يرجى المحاولة مرة أخرى لاحقاً',
            search: 'بحث',
            noResults: 'لا توجد نتائج',
            showMore: 'عرض المزيد',
            priceNotAvailable: 'السعر غير متوفر',
            off: 'خصم',
            category: 'الفئة',
            via:'عبر'
        },
        search: {
            resultsFor: ' نتيجة البحث لـ "{{query}}"',
            allProducts: 'All Products',
            showing: 'عرض {{shown}} منتج من {{total}} نتيجة',
            noResults: 'لم يتم العثور على منتجات لـ "{query}"'
          },
          footer: {
            aboutUs: "من نحن",
            aboutText: "نحن منصة تجارة إلكترونية رائدة مكرسة لتوفير أفضل الأسعار لعملائنا",
            quickLinks: "روابط سريعة",
            contactUs: "اتصل بنا",
            followUs: "تابعنا",
            facebook: "فيسبوك",
            twitter: "تويتر",
            instagram: "انستغرام",
            contactInfo: "معلومات الاتصال",
            email: "البريد الإلكتروني: support@example.com",
            phone: "الهاتف: مثال",
            address: "العنوان: مثال",
            rights: "جميع الحقوق محفوظة"
        }
    }
};

// Create the context
const LanguageContext = createContext();

// Create the provider component
export const LanguageProvider = ({ children }) => {
    // Initialize language from localStorage or default to English
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || LANGUAGES.EN;
    });

    // Track document direction (RTL/LTR)
    const [dir, setDir] = useState(() => {
        return currentLanguage === LANGUAGES.AR ? 'rtl' : 'ltr';
    });

    // Update localStorage and document direction when language changes
    useEffect(() => {
        localStorage.setItem('preferredLanguage', currentLanguage);
        setDir(currentLanguage === LANGUAGES.AR ? 'rtl' : 'ltr');
        document.documentElement.dir = currentLanguage === LANGUAGES.AR ? 'rtl' : 'ltr';
        document.documentElement.lang = currentLanguage;
    }, [currentLanguage]);

    // Function to change language
    const changeLanguage = (language) => {
        if (Object.values(LANGUAGES).includes(language)) {
            setCurrentLanguage(language);
        }
    };

    // Function to toggle between English and Arabic
    const toggleLanguage = () => {
        setCurrentLanguage(prev => prev === LANGUAGES.EN ? LANGUAGES.AR : LANGUAGES.EN);
    };

    // Function to get translation
    const t = (key) => {
        const keys = key.split('.');
        let value = translations[currentLanguage];
        
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) {
                console.warn(`Translation missing for key: ${key}`);
                return key;
            }
        }
        
        return value;
    };

    // Format number according to locale
    const formatNumber = (number) => {
        return new Intl.NumberFormat(currentLanguage === LANGUAGES.AR ? 'en-US' : 'en-US').format(number);
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (currentLanguage === LANGUAGES.AR) {
            return `${amount.toFixed(0)} ر.س`;
        }
        return `${amount.toFixed(0)} SAR`;
    };

    // Format date
    const formatDate = (date) => {
        return new Intl.DateTimeFormat(currentLanguage === LANGUAGES.AR ? 'ar-SA' : 'en-US').format(
            new Date(date)
        );
    };

    // Provide values to context
    const value = {
        language: currentLanguage,
        dir,
        changeLanguage,
        toggleLanguage,
        t,
        formatNumber,
        formatCurrency,
        formatDate,
        isRTL: currentLanguage === LANGUAGES.AR
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom hook to use the language context
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};