import type { Locale } from "@/i18n/config";
import {
  LANDING_DESCRIPTION,
  LANDING_KEYWORDS,
  LANDING_TITLE,
} from "@/seo/landingHead";
import {
  STUDIO_DESCRIPTION,
  STUDIO_KEYWORDS,
  STUDIO_TITLE,
} from "@/seo/studioHead";

export { STUDIO_KEYWORDS };

export type LocalizedPageMeta = {
  title: string;
  description: string;
  keywords: string;
};

/**
 * Locale-specific SEO metadata for key marketing pages.
 * Phrases target natural search terms in each language (not literal calques).
 */
const landingMetaByLocale: Record<Locale, LocalizedPageMeta> = {
  en: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    keywords: LANDING_KEYWORDS,
  },
  es: {
    title: "Diseñador de cajas 3D gratis y generador de mockups de packaging | 3D Box Studio",
    description:
      "Diseñador de cajas 3D online gratis y generador de mockups de packaging. Crea estuches y mailers en el navegador: dimensiones a medida, materiales PBR, apertura de tapa/flaps, arte por cara, guardado en la nube, enlaces de vista previa, exportación PNG y JSON.",
    keywords:
      "diseñador de cajas 3d, generador de mockups de packaging, mockup de caja online, diseñador de embalaje gratis, simulador de cartonaje 3d",
  },
  fr: {
    title: "Créateur de boîtes 3D gratuit et générateur de mockups packaging | 3D Box Studio",
    description:
      "Créateur de boîtes 3D en ligne gratuit et générateur de mockups d’emballage. Concevez cartons et mailers dans le navigateur : dimensions personnalisées, matériaux PBR, ouvertures de couvercle, artwork par face, sauvegarde cloud, liens de prévisualisation, export PNG et JSON.",
    keywords:
      "créateur de boîte 3d, générateur de mockup packaging, mockup de boîte en ligne, simulateur d’emballage 3d, designer packaging gratuit",
  },
  de: {
    title: "Kostenloser 3D-Schachtel-Designer & Verpackungs-Mockup-Generator | 3D Box Studio",
    description:
      "Kostenloser Online-3D-Schachtel-Designer und Verpackungs-Mockup-Generator. Faltschachteln und Mailer im Browser erstellen — individuelle Maße, PBR-Materialien, Deckel-/Klappenöffnung, Artwork je Seite, Cloud-Speicher, Vorschau-Links, PNG- & JSON-Export.",
    keywords:
      "3d schachtel designer, verpackungs mockup generator, online box mockup, faltschachtel simulator, kostenloser packaging designer",
  },
  zh: {
    title: "免费 3D 纸盒设计器与包装效果图生成器 | 3D Box Studio",
    description:
      "免费在线 3D 纸盒设计与包装效果图工具。在浏览器中创建折叠纸盒与邮寄盒：自定义尺寸、PBR 材质、开盖动画、单面贴图、云端保存、预览链接、PNG 与 JSON 导出。",
    keywords: "3d纸盒设计, 包装效果图生成器, 在线盒型设计, 免费包装模拟器, 邮寄盒mockup",
  },
};

const studioMetaByLocale: Record<Locale, LocalizedPageMeta> = {
  en: {
    title: STUDIO_TITLE,
    description: STUDIO_DESCRIPTION,
    keywords: STUDIO_KEYWORDS,
  },
  es: {
    title: "Creador de cajas 3D online gratis — Diseña estuches y mailers | 3D Box Studio",
    description:
      "Abre el estudio gratis de cajas 3D en el navegador. Crea una cuenta para diseñar: dimensiones, materiales, aperturas y arte por cara. Guarda y comparte, exporta mockups PNG o descargas JSON.",
    keywords:
      "diseñador de cajas 3d online, creador de mockups de packaging, simulador de cajas carton, herramienta mockup embalaje, diseñador de estuches gratis",
  },
  fr: {
    title: "Créateur de boîtes 3D en ligne gratuit — Cartons & mailers | 3D Box Studio",
    description:
      "Ouvrez le studio gratuit de boîtes 3D dans votre navigateur. Créez un compte pour concevoir : dimensions, matériaux, ouvertures et artwork par face. Sauvegardez, partagez, exportez des mockups PNG ou des JSON.",
    keywords:
      "créateur de boîte 3d en ligne, générateur de mockup packaging, simulateur carton pliant, outil mockup emballage, designer packaging gratuit",
  },
  de: {
    title: "Kostenloser 3D-Box-Maker online — Kartons & Mailer gestalten | 3D Box Studio",
    description:
      "Öffnen Sie den kostenlosen 3D-Box-Maker im Browser. Konto erstellen und gestalten: Maße, Materialien, Öffnungen und Artwork je Seite. Speichern, teilen, PNG-Mockups exportieren oder JSON herunterladen.",
    keywords:
      "3d schachtel designer online, verpackungs mockup generator, faltschachtel designer, packaging simulator, kostenloser box mockup tool",
  },
  zh: {
    title: "免费在线 3D 纸盒制作工具 — 设计纸盒与邮寄盒 | 3D Box Studio",
    description:
      "在浏览器中打开免费 3D 纸盒工作室。注册后即可设计尺寸、材质、开合与单面贴图；保存分享，导出 PNG 效果图或 JSON 备份。",
    keywords: "在线3d纸盒设计, 包装效果图工具, 折叠纸盒设计器, 包装模拟器, 免费盒型设计工具",
  },
};

export function getLandingPageMeta(locale: Locale): LocalizedPageMeta {
  return landingMetaByLocale[locale] ?? landingMetaByLocale.en;
}

export function getStudioPageMeta(locale: Locale): LocalizedPageMeta {
  return studioMetaByLocale[locale] ?? studioMetaByLocale.en;
}
