import React, { useEffect, useState } from 'react'
import './App.css'
import Gallery from 'react-photo-gallery'

const App = () => {
  const [images, setImages] = useState([])

  const openDirectory = async () => {
    const directoryPath = await window.api.openDirectory()
    if (directoryPath) {
      const images = await window.api.loadImages(directoryPath)

      // Convert each image buffer to an object URL for display
      const imageUrls = images.map((image) => {
        return { src: `data:image/jpeg;base64,${image.data}`, width: 4, height: 4 }
      })

      setImages(imageUrls)
    }
  }
  console.log(images)
  useEffect(() => {
    // Listen for 'init-images' event from the main process
    window.api.onInitImages(async (_event, imagePath) => {
      console.log('Received image paths:', imagePath)
      if (imagePath) {
        const images = await window.api.loadImages(imagePath)

        // Convert each image buffer to an object URL for display
        const imageUrls = images.map((image) => {
          return { src: `data:image/jpeg;base64,${image.data}`, width: 4, height: 4 }
        })

        setImages(imageUrls)
      }

      //setImages(imagePaths) // Update state with the image paths
    })

    // Clean up the listener when the component unmounts
    return () => {}
  }, [])

  useEffect(() => {
    // window.api.captureScreen().then((imageData) => {
    //   if (imageData) {
    //     // Set the background of the page
    //     const backgroundElement = document.getElementById('background')
    //     if (backgroundElement) {
    //       backgroundElement.style.backgroundImage = `url(${imageData})`
    //     }
    //   }
    // })
    return () => {}
  }, [])

  window.api.onEnterFullScreen(() => {
    console.log('entered')
    window.api.captureScreen().then((imageData) => {
      const backgroundElement = document.getElementById('background')
      if (backgroundElement) {
        backgroundElement.style.backgroundImage = `url(${imageData})`
      }
      // document.body.style.backgroundImage = `url(${imageData})` // Use the captured screen as background
      // document.body.style.backgroundSize = 'cover'
      // document.body.style.backgroundPosition = 'center center'
      // document.body.style.transition = 'background-image 0.3s ease'
    })
  })

  window.api.onLeaveFullScreen(() => {
    console.log('leaved')

    document.body.style.backgroundImage = '' // Clear background when exiting full-screen
  })
  return (
    <div className="App">
      <div id="background"></div>
      <div id="background-overlay"></div>
      <h1>Photo Viewer</h1>
      <button onClick={openDirectory}>Open Folder</button>
      {/* {images.length > 0 && images.map((image: any) => <img src={image.src} key={image} />)} */}
      {images.length > 0 && <Gallery columns={6} margin={10} photos={images} />}
    </div>
  )
}

export default App
