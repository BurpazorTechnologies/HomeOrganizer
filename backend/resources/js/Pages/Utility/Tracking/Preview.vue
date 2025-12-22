<script setup lang="ts">

</script>

<template>
    <div>
        <header>
            <nav>
                <!-- Example showing how to append extra contextual tracking data -->
                <a
                    href="#mainHero"
                    data-tracking-id="nav-main-hero"
                    data-tracking-context="primary-navigation"
                    data-tracking-campaign="tracking-preview-demo"
                    data-tracking-user_state="guest"
                >
                    Main Hero
                </a>
                <a href="#about" data-tracking-id="nav-about">About</a>
                <a href="#services" data-tracking-id="nav-services">Services</a>
                <a href="#forms" data-tracking-id="nav-forms">Forms</a>
                <a href="#media" data-tracking-id="nav-media">Media</a>
                <a href="#lists" data-tracking-id="nav-lists">Lists</a>
                <a href="#tables" data-tracking-id="nav-tables">Tables</a>
                <a href="#contact" data-tracking-id="nav-contact">Contact</a>
            </nav>
        </header>
        <main>
            <section id="mainHero">
                <h1>Main Hero Section</h1>
                <h2>Subheading H2</h2>
                <h3>Subheading H3</h3>
                <h4>Subheading H4</h4>
                <h5>Subheading H5</h5>
                <h6>Subheading H6</h6>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                <span>Inline span element</span>
                <div>Div container element</div>
                <button>Button Element</button>
                <button type="button">Button Type Button</button>
                <button type="submit">Button Type Submit</button>
                <a href="https://example.com">External Link</a>
                <a href="#about">Internal Link</a>
            </section>
            <section id="about">
                <h2>About Section</h2>
                <article>
                    <h3>Article Title</h3>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                </article>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            </section>
            <section id="services">
                <h2>Services Section</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            </section>
            <section id="forms">
                <h2>Forms Section</h2>
                <form>
                    <label>Text Input</label>
                    <input type="text" name="textInput">
                    <label>Email Input</label>
                    <input type="email" name="emailInput">
                    <label>Password Input</label>
                    <input type="password" name="passwordInput">
                    <label>Number Input</label>
                    <input type="number" name="numberInput">
                    <label>Date Input</label>
                    <input type="date" name="dateInput">
                    <label>Time Input</label>
                    <input type="time" name="timeInput">
                    <label>Checkbox</label>
                    <input type="checkbox" name="checkbox1" value="option1">
                    <input type="checkbox" name="checkbox2" value="option2">
                    <label>Radio Buttons</label>
                    <input type="radio" name="radioGroup" value="radio1">
                    <input type="radio" name="radioGroup" value="radio2">
                    <label>Select Dropdown</label>
                    <select name="selectInput">
                        <option value="option1">Option 1</option>
                        <option value="option2">Option 2</option>
                        <option value="option3">Option 3</option>
                    </select>
                    <label>Textarea</label>
                    <textarea name="textareaInput"></textarea>
                    <input type="submit" value="Submit Button">
                    <input type="button" value="Input Button">
                    <button type="reset">Reset Button</button>
                </form>
            </section>
            <section id="media">
                <h2>Media Section</h2>
                <img src="#" alt="Image Element">
                <video src="#" controls>Video Element</video>
                <audio src="#" controls>Audio Element</audio>
                <iframe src="#" title="Iframe Element"></iframe>
            </section>
            <section id="lists">
                <h2>Lists Section</h2>
                <ul>
                    <li>Unordered List Item 1</li>
                    <li>Unordered List Item 2</li>
                    <li>Unordered List Item 3</li>
                </ul>
                <ol>
                    <li>Ordered List Item 1</li>
                    <li>Ordered List Item 2</li>
                    <li>Ordered List Item 3</li>
                </ol>
                <dl>
                    <dt>Definition Term</dt>
                    <dd>Definition Description</dd>
                </dl>
            </section>
            <section id="tables">
                <h2>Tables Section</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Header 1</th>
                            <th>Header 2</th>
                            <th>Header 3</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Cell 1</td>
                            <td>Cell 2</td>
                            <td>Cell 3</td>
                        </tr>
                        <tr>
                            <td>Cell 4</td>
                            <td>Cell 5</td>
                            <td>Cell 6</td>
                        </tr>
                    </tbody>
                </table>
            </section>
            <section id="contact">
                <h2>Contact Section</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <address>
                    Contact Address Element
                </address>
            </section>
        </main>
        <footer>
            <p>Footer Element</p>
        </footer>
    </div>
</template>

<style scoped>
div {
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    margin: 0;
}

* {
    box-sizing: border-box;
}

header {
    border: 1px solid #000;
    margin-bottom: 20px;
    padding: 15px;
    width: 100%;
    box-sizing: border-box;
}

nav {
    border: 1px solid #000;
    padding: 15px;
    width: 100%;
    box-sizing: border-box;
}

nav a {
    display: inline-block;
    border: 1px solid #000;
    padding: 8px 15px;
    margin: 5px;
    text-decoration: none;
}

main {
    border: 1px solid #000;
    padding: 20px;
    width: 100%;
    box-sizing: border-box;
}

section {
    border: 1px solid #000;
    margin: 20px 0;
    padding: 20px;
    width: 100%;
    box-sizing: border-box;
}

h1, h2, h3, h4, h5, h6 {
    border: 1px solid #000;
    margin: 10px 0;
    padding: 5px;
}

p {
    border: 1px solid #000;
    margin: 10px 0;
    padding: 5px;
}

span {
    display: inline-block;
    border: 1px solid #000;
    padding: 5px;
    margin: 5px;
}

div > div {
    border: 1px solid #000;
    margin: 10px 0;
    padding: 10px;
}

button {
    border: 1px solid #000;
    margin: 5px;
    padding: 8px 15px;
    display: inline-block;
}

a {
    border: 1px solid #000;
    padding: 5px 10px;
    margin: 5px;
    display: inline-block;
    text-decoration: none;
}

article {
    border: 1px solid #000;
    margin: 10px 0;
    padding: 10px;
}

form {
    border: 1px solid #000;
    padding: 20px;
    margin: 10px 0;
    width: 100%;
    box-sizing: border-box;
}

label {
    display: block;
    border: 1px solid #000;
    margin: 10px 0 5px 0;
    padding: 5px;
}

input {
    border: 1px solid #000;
    margin: 5px 0;
    padding: 8px;
    display: block;
    width: 100%;
    max-width: 600px;
    box-sizing: border-box;
}

input[type="checkbox"],
input[type="radio"] {
    display: inline-block;
    margin-right: 10px;
}

select {
    border: 1px solid #000;
    margin: 5px 0;
    padding: 8px;
    display: block;
    width: 100%;
    max-width: 600px;
    box-sizing: border-box;
}

textarea {
    border: 1px solid #000;
    margin: 5px 0;
    padding: 8px;
    display: block;
    width: 100%;
    max-width: 600px;
    box-sizing: border-box;
}

img {
    border: 1px solid #000;
    margin: 10px 0;
    display: block;
    max-width: 300px;
    height: 100px;
}

video {
    border: 1px solid #000;
    margin: 10px 0;
    display: block;
    max-width: 300px;
}

audio {
    border: 1px solid #000;
    margin: 10px 0;
    display: block;
    max-width: 300px;
}

iframe {
    border: 1px solid #000;
    margin: 10px 0;
    display: block;
    max-width: 300px;
    height: 200px;
}

ul, ol {
    border: 1px solid #000;
    margin: 10px 0;
    padding: 15px 30px;
}

li {
    border: 1px solid #000;
    margin: 5px 0;
    padding: 5px;
}

dl {
    border: 1px solid #000;
    margin: 10px 0;
    padding: 10px;
}

dt {
    border: 1px solid #000;
    margin: 5px 0;
    padding: 5px;
}

dd {
    border: 1px solid #000;
    margin: 5px 0 5px 20px;
    padding: 5px;
}

table {
    border: 1px solid #000;
    margin: 10px 0;
    border-collapse: collapse;
    width: 100%;
}

thead {
    border: 1px solid #000;
}

tbody {
    border: 1px solid #000;
}

tr {
    border: 1px solid #000;
}

th {
    border: 1px solid #000;
    padding: 8px;
}

td {
    border: 1px solid #000;
    padding: 8px;
}

address {
    border: 1px solid #000;
    margin: 10px 0;
    padding: 10px;
    display: block;
}

footer {
    border: 1px solid #000;
    margin-top: 20px;
    padding: 15px;
    width: 100%;
    box-sizing: border-box;
}
</style>
