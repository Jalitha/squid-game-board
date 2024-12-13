let currentStep = 1;
let number = '';
const steps = document.querySelectorAll('.step');
const countdownElement = document.getElementById('countdown');

function showStep(step) {
    steps.forEach((el, idx) => el.classList.toggle('active', idx + 1 === step));
    currentStep = step;
}

document.getElementById('start-button').addEventListener('click', () => {
    number = ''; // Clear the number
    document.getElementById('number-display').textContent = '___'; // Reset display
    showStep(2);
});


document.querySelectorAll('.num-button').forEach((button) => {
    button.addEventListener('click', () => {
        if (number.length < 3) {
            number += button.textContent;
            document.getElementById('number-display').textContent = number.padStart(3, '_');
        }
    });
});

document.getElementById('submit-number').addEventListener('click', () => {
    if (number.length === 3) {
        // Check if the number is already registered
        fetch(`/api/check-number/${number}`)
            .then((res) => res.json())
            .then((data) => {
                const errorMessage = document.getElementById('error-message');
                if (data.isRegistered) {
                    errorMessage.textContent = 'This number is already registered.'; // Set the message
                    errorMessage.classList.add('visible'); // Show the message
                } else {
                    errorMessage.classList.remove('visible'); // Hide the message
                    showStep(3); // Proceed if the number is valid
                    startCamera();
                }
            })
            .catch((error) => {
                console.error('Error checking number:', error);
            });
    }
});

document.getElementById('clear-button').addEventListener('click', () => {
    number = ''; // Clear the number input
    document.getElementById('number-display').textContent = '___';
    document.getElementById('error-message').classList.remove('visible'); // Hide the error message
});


function startCamera() {
    const video = document.getElementById('camera-feed'); // Use the video element
    const countdownElement = document.getElementById('countdown');

    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream; // Attach the stream to the video element
            video.play();

            let countdown = 1;
            const interval = setInterval(() => {
                countdown--;
                countdownElement.textContent = countdown;
                if (countdown === 0) {
                    clearInterval(interval);
                    takePhoto(video, stream); // Pass the video and stream to the photo function
                }
            }, 1000);
        })
        .catch((error) => {
            console.error('Error accessing the camera:', error);
        });
}

function takePhoto(video, stream) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoData = canvas.toDataURL('image/jpeg');
    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, photo: photoData }),
    }).then(() => {
        stream.getTracks().forEach((track) => track.stop()); // Stop the camera
        showStep4();
        setTimeout(() => showStep(1), 5000); // Return to step 1 after 5 seconds
    });
}

function showStep4() {
    showStep(4); // Show Step 4 with the static tick
    setTimeout(() => {
        showStep(1); // Go back to Step 1 after 5 seconds
    }, 5000);
}