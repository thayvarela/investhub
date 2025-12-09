import { GoogleGenAI, Type } from "@google/genai";
import { Asset, AssetClassification } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const classifyAssets = async (assets: Partial<Asset>[]): Promise<AssetClassification[]> => {
  const assetListString = assets.map(a => `${a.ticker} (${a.name})`).join(', ');

  const prompt = `
    Você é um especialista em finanças e gestão de portfólio.
    Analise a seguinte lista de ativos financeiros e classifique-os em:
    1. 'category': Uma categoria macro. Use nomes sugestivos como "Bolsa Brasil", "Ativos Globais", "Criptoativos", "Fundos Imobiliários", "Renda Fixa".
    2. 'subCategory': Um segmento específico de indústria ou tipo. Use nomes sugestivos como "Bancos", "Petróleo e Gás", "Tecnologia", "Ouro", "Utilities", "Logística", "Blockchain L1".

    Lista de ativos: ${assetListString}

    Regras:
    - Mantenha consistência.
    - Se o ativo for desconhecido, faça sua melhor estimativa baseada no ticker.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ticker: { type: Type.STRING },
              category: { type: Type.STRING },
              subCategory: { type: Type.STRING },
            },
            required: ["ticker", "category", "subCategory"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const classifications = JSON.parse(jsonText) as AssetClassification[];
    return classifications;

  } catch (error) {
    console.error("Erro ao classificar ativos com Gemini:", error);
    // Fallback básico caso a API falhe
    return assets.map(a => ({
      ticker: a.ticker || '',
      category: 'Não Classificado',
      subCategory: 'Geral'
    }));
  }
};
