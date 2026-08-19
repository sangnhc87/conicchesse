import { storageGet } from './safeStorage';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function explainBlunder(boardFen, playerMoveVi, bestMoveVi) {
  const apiKey = storageGet('gemini_api_key', '');
  
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const prompt = `
Bạn là một Đại sư Cờ Tướng (Siêu Sư Phụ AI) chuyên hướng dẫn cho trẻ em.
Học trò của bạn vừa đi một nước cờ sai lầm.

- Tình huống bàn cờ hiện tại (FEN): ${boardFen}
- Nước cờ sai học trò vừa đi: ${playerMoveVi}
- Nước cờ tốt nhất (do Pikafish đề xuất): ${bestMoveVi}

Hãy giải thích NGẮN GỌN (dưới 4 câu) bằng tiếng Việt thật dễ hiểu, thân thiện, động viên trẻ em:
1. Tại sao nước cờ "${playerMoveVi}" lại là sai lầm (bị mất quân gì, hở sườn, hay bị chiếu bí)?
2. Tại sao nước cờ "${bestMoveVi}" lại tốt hơn?

Không dùng từ ngữ quá hàn lâm. Không cần phân tích các nước đi tiếp theo quá sâu.
`.trim();

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Lỗi kết nối Gemini API');
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    }
    
    return "Thầy đang bận suy nghĩ, con thử tự tìm hiểu xem sao nhé!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
