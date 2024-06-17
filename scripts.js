// Instead of reading and displaying the PDF, we display the iframe
const pdfViewer = document.getElementById('pdfViewer');
pdfViewer.innerHTML = `<iframe src="https://docs.google.com/document/d/e/2PACX-1vT3CQjeWxgVMxP0ItMIDLFc8ftnqu8UT2RxXwoYauE_o3MQY2OvWLBarFjNbG_PBQLvqXKINE4TOc7D/pub?embedded=true" width="100%" style="height: calc(100vh - 10px);"></iframe>`;

// Initialize the timer with 30 minutes (in seconds)
let timeLeft = 30 * 60;
const timerElement = document.getElementById('timer');

// Function to update the timer display
function updateTimer() {
  // Calculate minutes and seconds
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Update the timer element's text content
  timerElement.textContent = `Time left: ${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Decrease the time left, or submit the form if time is up
  if (timeLeft > 0) {
    timeLeft--;
  } else {
    document.getElementById('examForm').submit();
  }
}

// Call the updateTimer function every second
setInterval(updateTimer, 1000);



// Fetch answer key from GitHub repository
async function fetchAnswerKey() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/hordcnrb/hordcnrb.github.io/main/answerKey.json'); // Replace with your actual repo URL
    const answerKey = await response.json();
    return answerKey;
  } catch (error) {
    console.error('Error fetching answer key:', error);
    return {}; // Return an empty object if there's an error
  }
}

// Function to create a CSV string from the form data
async function createCSV(formData) {
  const answerKey = await fetchAnswerKey();
  let csvContent = "Q No,Answer,My Answer,Result\n"; // Header row
  let correctAnswers = 0;
  let name = formData.get('name');
  let examName = formData.get('exam');

  formData.forEach((value, key) => {
    if (key.startsWith('question')) {
      const questionNumber = key.substring('question'.length);
      const selectedAnswer = value;
      const correctAnswer = answerKey[questionNumber];
      const result = selectedAnswer === correctAnswer ? "Correct" : "Incorrect";
      csvContent += `${questionNumber},${correctAnswer},${selectedAnswer},${result}\n`;
      if (result === "Correct") {
        correctAnswers++;
      }
    }
  });

  const totalQuestions = Object.keys(answerKey).length;
  const percentage = (correctAnswers / totalQuestions) * 100;
  const result = percentage >= 60 ? "Pass" : "Fail";

  // Create the result string for display
  const resultHTML = `
    <div>
      <p>Name: ${name}</p>
      <p>Exam: ${examName}</p>
      <p>Total Marks Scored: ${correctAnswers}</p>
      <p>Percentage: ${percentage.toFixed(2)}%</p>
      <p>Result: ${result}</p>
    </div>
  `;

  // Update the CSV content to include the result HTML
  csvContent += `\n${name},${examName},Percentage,${percentage.toFixed(2)}%\n${name},${examName},Result,${result}`;

  return { csvContent, resultHTML }; // Return both CSV and resultHTML
}

// Function to download the CSV file
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to display results in the HTML
function displayResults(resultHTML) {
  const resultDiv = document.getElementById('results');
  resultDiv.innerHTML = resultHTML; // Use the resultHTML string directly
}

// Function to show the results in a popup
function showResultsPopup(resultHTML) {
  const popup = document.createElement('div');
  popup.id = 'resultsPopup';
  popup.style.position = 'fixed';
  popup.style.top = '0';
  popup.style.left = '0';
  popup.style.width = '100%';
  popup.style.height = '100%';
  popup.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  popup.style.display = 'flex';
  popup.style.justifyContent = 'center';
  popup.style.alignItems = 'center';

  const content = document.createElement('div');
  content.style.backgroundColor = '#fff';
  content.style.padding = '20px';
  content.style.borderRadius = '5px';
  content.innerHTML = resultHTML;

  popup.appendChild(content);
  document.body.appendChild(popup);

  // Add a close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.marginTop = '20px';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(popup);
  });
  content.appendChild(closeButton);
}

// Listen for form submission
document.getElementById('examForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const { csvContent, resultHTML } = await createCSV(formData); // Get both from createCSV
  downloadCSV(csvContent, 'exam_results.csv');
  showResultsPopup(resultHTML); // Display the results in a popup
  // alert('Your answers have been submitted and results are downloaded.');
});