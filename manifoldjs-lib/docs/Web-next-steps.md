# Configuring the manifest in your site

1. Upload the manifest.json and the images to the root path of your site.

2. Reference the manifest in your page with a link tag:

	````
	<link rel="manifest" href="manifest.json"></link>
	````

3. Add the [ManUp.js](https://github.com/boyofgreen/manUp.js/) polyfill to your site and reference it in your page with a script tag:

	````
	<script src="manup.js"></script>
	````

4. Redeploy your site and test it in the different devices.
