// QuestionEngine.js
// Pure grading logic shared by every scene. Given a question definition and
// the player's response, returns { correct: boolean }.

function arraysEqualAsSets(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

function arraysEqualOrdered(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

// response shapes per type:
//  mcq:        number (selected option index)
//  truefalse:  boolean
//  multi:      number[]  (selected indices)
//  sequence:   number[]  (item indices in the player's chosen order)
//  match:      Array<[leftIndex, rightIndex]>
export function checkAnswer(question, response) {
  if (!question) return { correct: false };

  switch (question.type) {
    case 'mcq':
      return { correct: Number(response) === Number(question.answer) };

    case 'truefalse':
      return { correct: Boolean(response) === Boolean(question.answer) };

    case 'multi':
      return { correct: arraysEqualAsSets(response, question.answers) };

    case 'sequence': {
      // The player provides the item indices in their chosen order.
      // Correct when that ordering matches question.order exactly.
      return { correct: arraysEqualOrdered(response, question.order) };
    }

    case 'match': {
      // response: array of [leftIndex, rightIndex]; compare as a set of pairs.
      if (!Array.isArray(response)) return { correct: false };
      if (response.length !== question.pairs.length) return { correct: false };
      const norm = (pairs) =>
        pairs
          .map((p) => `${p[0]}:${p[1]}`)
          .sort()
          .join('|');
      return { correct: norm(response) === norm(question.pairs) };
    }

    default:
      console.warn('QuestionEngine: unknown question type', question.type);
      return { correct: false };
  }
}

export default { checkAnswer };
