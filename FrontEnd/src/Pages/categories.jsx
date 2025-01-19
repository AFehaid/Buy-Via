// src/config/categories.js
import {
    Laptop,
    Smartphone,
    Home,
    Gamepad,
    Shirt,
    Dumbbell,
    Package,
    Camera,
    Music,
    Gift,
    ShoppingBag,
    Headphones,
    Watch,
    BookOpen,
    Baby
} from 'lucide-react';

export const LANGUAGES = {
    EN: 'en',
    AR: 'ar'
};

export const categories = {
    computers: {
        id: 'computers',
        icon: Laptop,
        translations: {
            [LANGUAGES.EN]: 'Computers',
            [LANGUAGES.AR]: 'أجهزة الكمبيوتر'
        },
        subcategories: [
            {
                id: 1,
                translations: {
                    [LANGUAGES.EN]: 'Desktops & Workstations',
                    [LANGUAGES.AR]: 'أجهزة سطح المكتب ومحطات العمل'
                }
            },
            {
                id: 2,
                translations: {
                    [LANGUAGES.EN]: 'Laptops & Notebooks',
                    [LANGUAGES.AR]: 'أجهزة الكمبيوتر المحمولة'
                }
            },
            {
                id: 3,
                translations: {
                    [LANGUAGES.EN]: 'Tablets & E-Readers',
                    [LANGUAGES.AR]: 'الأجهزة اللوحية وقارئات الكتب الإلكترونية'
                }
            },
            {
                id: 6,
                translations: {
                    [LANGUAGES.EN]: 'Computer Components',
                    [LANGUAGES.AR]: 'مكونات الكمبيوتر'
                }
            },
            {
                id: 7,
                translations: {
                    [LANGUAGES.EN]: 'Computer Peripherals',
                    [LANGUAGES.AR]: 'ملحقات الكمبيوتر'
                }
            },
            {
                id: 8,
                translations: {
                    [LANGUAGES.EN]: 'Networking Equipment',
                    [LANGUAGES.AR]: 'معدات الشبكات'
                }
            },
            {
                id: 9,
                translations: {
                    [LANGUAGES.EN]: 'Printers & Scanners',
                    [LANGUAGES.AR]: 'الطابعات والماسحات الضوئية'
                }
            },
            {
                id: 11,
                translations: {
                    [LANGUAGES.EN]: 'Storage Devices',
                    [LANGUAGES.AR]: 'أجهزة التخزين'
                }
            }
        ]
    },
    smartphones: {
        id: 'smartphones',
        icon: Smartphone,
        translations: {
            [LANGUAGES.EN]: 'Smartphones',
            [LANGUAGES.AR]: 'الهواتف الذكية'
        },
        subcategories: [
            {
                id: 4,
                translations: {
                    [LANGUAGES.EN]: 'Smartphones & Cell Phones',
                    [LANGUAGES.AR]: 'الهواتف الذكية والجوالات'
                }
            },
            {
                id: 12,
                translations: {
                    [LANGUAGES.EN]: 'Wearable Technology',
                    [LANGUAGES.AR]: 'التقنيات القابلة للارتداء'
                }
            },
            {
                id: 13,
                translations: {
                    [LANGUAGES.EN]: 'Phone Accessories',
                    [LANGUAGES.AR]: 'إكسسوارات الهواتف'
                }
            },
            {
                id: 14,
                translations: {
                    [LANGUAGES.EN]: 'Device Accessories',
                    [LANGUAGES.AR]: 'ملحقات الأجهزة'
                }
            }
        ]
    },
    homeAndKitchen: {
        id: 'homeAndKitchen',
        icon: Home,
        translations: {
            [LANGUAGES.EN]: 'Home & Kitchen',
            [LANGUAGES.AR]: 'المنزل والمطبخ'
        },
        subcategories: [
            {
                id: 23,
                translations: {
                    [LANGUAGES.EN]: 'Home Appliances',
                    [LANGUAGES.AR]: 'الأجهزة المنزلية'
                }
            },
            {
                id: 24,
                translations: {
                    [LANGUAGES.EN]: 'Kitchen Appliances',
                    [LANGUAGES.AR]: 'أجهزة المطبخ'
                }
            },
            {
                id: 25,
                translations: {
                    [LANGUAGES.EN]: 'Furniture & Home Decor',
                    [LANGUAGES.AR]: 'الأثاث والديكور المنزلي'
                }
            },
            {
                id: 26,
                translations: {
                    [LANGUAGES.EN]: 'Home Improvement Tools',
                    [LANGUAGES.AR]: 'أدوات تحسين المنزل'
                }
            },
            {
                id: 27,
                translations: {
                    [LANGUAGES.EN]: 'Home Security & Surveillance',
                    [LANGUAGES.AR]: 'الأمن والمراقبة المنزلية'
                }
            }
        ]
    },
    entertainment: {
        id: 'entertainment',
        icon: Gamepad,
        translations: {
            [LANGUAGES.EN]: 'Entertainment',
            [LANGUAGES.AR]: 'الترفيه'
        },
        subcategories: [
            {
                id: 19,
                translations: {
                    [LANGUAGES.EN]: 'Gaming Consoles',
                    [LANGUAGES.AR]: 'أجهزة الألعاب'
                }
            },
            {
                id: 20,
                translations: {
                    [LANGUAGES.EN]: 'Handheld Gaming Devices',
                    [LANGUAGES.AR]: 'أجهزة الألعاب المحمولة'
                }
            },
            {
                id: 21,
                translations: {
                    [LANGUAGES.EN]: 'Gaming Accessories',
                    [LANGUAGES.AR]: 'ملحقات الألعاب'
                }
            },
            {
                id: 22,
                translations: {
                    [LANGUAGES.EN]: 'Video Games',
                    [LANGUAGES.AR]: 'ألعاب الفيديو'
                }
            },
            {
                id: 18,
                translations: {
                    [LANGUAGES.EN]: 'TV & Home Theater',
                    [LANGUAGES.AR]: 'التلفاز والمسرح المنزلي'
                }
            },
            {
                id: 17,
                translations: {
                    [LANGUAGES.EN]: 'Audio Equipment',
                    [LANGUAGES.AR]: 'معدات الصوت'
                }
            }
        ]
    },
    fashion: {
        id: 'fashion',
        icon: Shirt,
        translations: {
            [LANGUAGES.EN]: 'Fashion',
            [LANGUAGES.AR]: 'الأزياء'
        },
        subcategories: [
            {
                id: 28,
                translations: {
                    [LANGUAGES.EN]: 'Clothing',
                    [LANGUAGES.AR]: 'الملابس'
                }
            },
            {
                id: 29,
                translations: {
                    [LANGUAGES.EN]: 'Shoes',
                    [LANGUAGES.AR]: 'الأحذية'
                }
            },
            {
                id: 30,
                translations: {
                    [LANGUAGES.EN]: 'Fashion Accessories',
                    [LANGUAGES.AR]: 'إكسسوارات الموضة'
                }
            },
            {
                id: 31,
                translations: {
                    [LANGUAGES.EN]: 'Jewelry',
                    [LANGUAGES.AR]: 'المجوهرات'
                }
            },
            {
                id: 32,
                translations: {
                    [LANGUAGES.EN]: 'Beauty Products',
                    [LANGUAGES.AR]: 'منتجات التجميل'
                }
            },
            {
                id: 33,
                translations: {
                    [LANGUAGES.EN]: 'Health & Wellness',
                    [LANGUAGES.AR]: 'الصحة والعافية'
                }
            },
            {
                id: 34,
                translations: {
                    [LANGUAGES.EN]: 'Personal Care & Hygiene',
                    [LANGUAGES.AR]: 'العناية الشخصية والنظافة'
                }
            }
        ]
    },
    sports: {
        id: 'sports',
        icon: Dumbbell,
        translations: {
            [LANGUAGES.EN]: 'Sports',
            [LANGUAGES.AR]: 'الرياضة'
        },
        subcategories: [
            {
                id: 35,
                translations: {
                    [LANGUAGES.EN]: 'Sports Equipment',
                    [LANGUAGES.AR]: 'المعدات الرياضية'
                }
            },
            {
                id: 36,
                translations: {
                    [LANGUAGES.EN]: 'Outdoor Gear',
                    [LANGUAGES.AR]: 'معدات الهواء الطلق'
                }
            },
            {
                id: 37,
                translations: {
                    [LANGUAGES.EN]: 'Fitness Equipment',
                    [LANGUAGES.AR]: 'معدات اللياقة البدنية'
                }
            }
        ]
    },
    other: {
        id: 'other',
        icon: Package,
        translations: {
            [LANGUAGES.EN]: 'Other Categories',
            [LANGUAGES.AR]: 'فئات أخرى'
        },
        subcategories: [
            {
                id: 15,
                translations: {
                    [LANGUAGES.EN]: 'Cameras & Camcorders',
                    [LANGUAGES.AR]: 'الكاميرات وكاميرات الفيديو'
                }
            },
            {
                id: 16,
                translations: {
                    [LANGUAGES.EN]: 'Camera Accessories',
                    [LANGUAGES.AR]: 'ملحقات الكاميرا'
                }
            },
            {
                id: 38,
                translations: {
                    [LANGUAGES.EN]: 'Books & Magazines',
                    [LANGUAGES.AR]: 'الكتب والمجلات'
                }
            },
            {
                id: 39,
                translations: {
                    [LANGUAGES.EN]: 'Music & Musical Instruments',
                    [LANGUAGES.AR]: 'الموسيقى والآلات الموسيقية'
                }
            },
            {
                id: 45,
                translations: {
                    [LANGUAGES.EN]: 'Toys & Games',
                    [LANGUAGES.AR]: 'الألعاب والدمى'
                }
            },
            {
                id: 49,
                translations: {
                    [LANGUAGES.EN]: 'Pet Supplies',
                    [LANGUAGES.AR]: 'مستلزمات الحيوانات الأليفة'
                }
            },
            {
                id: 50,
                translations: {
                    [LANGUAGES.EN]: 'Baby Products',
                    [LANGUAGES.AR]: 'منتجات الأطفال'
                }
            },
            {
                id: 51,
                translations: {
                    [LANGUAGES.EN]: 'Garden & Patio',
                    [LANGUAGES.AR]: 'الحديقة والفناء'
                }
            },
            {
                id: 52,
                translations: {
                    [LANGUAGES.EN]: 'Gift Cards & Vouchers',
                    [LANGUAGES.AR]: 'بطاقات الهدايا والقسائم'
                }
            },
            {
                id: 53,
                translations: {
                    [LANGUAGES.EN]: 'Smart Home Devices',
                    [LANGUAGES.AR]: 'أجهزة المنزل الذكي'
                }
            }
        ]
    }
};

// Helper functions
export const getCategoryList = (language = LANGUAGES.EN) => {
    return Object.values(categories).map(category => ({
        header: category.translations[language],
        icon: category.icon,
        subcategories: category.subcategories.map(sub => ({
            id: sub.id,
            name: sub.translations[language]
        }))
    }));
};

export const getCategoryById = (id, language = LANGUAGES.EN) => {
    for (const category of Object.values(categories)) {
        const subcategory = category.subcategories.find(sub => sub.id === parseInt(id));
        if (subcategory) {
            return {
                category: category.translations[language],
                subcategory: subcategory.translations[language]
            };
        }
    }
    return null;
};

export const getAllSubcategories = (language = LANGUAGES.EN) => {
    const result = {};
    Object.values(categories).forEach(category => {
        category.subcategories.forEach(sub => {
            result[sub.id] = sub.translations[language];
        });
    });
    return result;
};