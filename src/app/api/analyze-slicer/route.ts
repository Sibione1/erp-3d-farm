import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body; // Base64 string of the image

    if (!image) {
      return NextResponse.json({ error: 'Nenhuma imagem fornecida' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada no servidor' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // The image usually comes as "data:image/png;base64,iVBORw0KGgo..."
    const matches = image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ error: 'Formato de imagem inválido' }, { status: 400 });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const prompt = `Analise esta captura de tela do fatiador Bambu Studio e extraia os dados de impressão.
Retorne estritamente um objeto JSON válido seguindo a estrutura abaixo:
{
  "projectName": "Nome do projeto (aparece no topo, ex: Gohan). null se não achar",
  "hours": <tempo total em horas. Atenção: se houver dias, converta. Ex: 1d10h = 34>,
  "minutes": <minutos do tempo total, ex: 27>,
  "totalGrams": <valor total em gramas de material, ex: 132.31>,
  "filaments": [
    { "name": "Nome exato da cor e material (Ex: PLA Lite CIANO)", "grams": <gramas específicas deste filamento> }
  ]
}
Atenção na lista de 'filaments':
1. Procure a seção "Filamentos do Projeto" (geralmente à esquerda) para encontrar o NOME e a COR do filamento (ex: "1 PLA Lite CIANO").
2. Procure a seção "Esquema de cores" ou a tabela de Resultado do fatiamento para encontrar a QUANTIDADE EM GRAMAS exata de cada filamento usado (correspondendo ao número 1, 2, etc).
Se houver apenas um filamento e você encontrar o totalGrams, pode assumir que o filamento 1 usou o totalGrams.
Não inclua \`\`\`json na resposta, apenas o JSON puro.`;

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ],
        config: {
            temperature: 0.0,
            responseMimeType: "application/json"
        }
    });

    const ocrText = response.text || '';
    console.log("=== OCR JSON ===\n", ocrText);

    let data;
    try {
       // O responseMimeType já deve garantir JSON, mas fazemos parse
       data = JSON.parse(ocrText);
    } catch (e) {
       console.error("Failed to parse JSON", e);
       data = { hours: 0, minutes: 0, totalGrams: 0, filaments: [], projectName: null };
    }

    return NextResponse.json({ ...data, rawText: ocrText });

  } catch (error: any) {
    console.error("API Analyze Slicer Error:", error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

