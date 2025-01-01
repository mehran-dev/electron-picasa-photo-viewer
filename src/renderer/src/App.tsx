import React, { useEffect, useState } from 'react'
import './App.css'

const App = () => {
  const [images, setImages] = useState([])
  const [bannerImages, setBannerImages] = useState([])

  const openDirectory = async () => {
    const directoryPath = await window.api.openDirectory()
    if (directoryPath) {
      const images = await window.api.loadImages(directoryPath)

      // Convert each image buffer to an object URL for display
      const imageUrls = images.map((image) => {
        return { src: `data:image/jpeg;base64,${image.data}` }
      })

      setImages(imageUrls)
      setBannerImages([imageUrls[0]])
    }
  }

  useEffect(() => {
    // Listen for 'init-images' event from the main process
    window.api.onInitImages(async (_event, imagePath) => {
      console.log('Received image paths:', imagePath)
      if (imagePath) {
        const images = await window.api.loadImages(imagePath)

        // Convert each image buffer to an object URL for display
        const imageUrls = images.map((image) => {
          return { src: `data:image/jpeg;base64,${image.data}` }
        })

        setImages(imageUrls)
      }
    })

    return () => {}
  }, [])

  window.api.onEnterFullScreen(() => {
    console.log('entered')
    window.api.captureScreen().then((imageData) => {
      const backgroundElement = document.getElementById('background')
      if (backgroundElement) {
        backgroundElement.style.backgroundImage = `url(${imageData})`
      }
    })
  })

  window.api.onLeaveFullScreen(() => {
    console.log('leaved')
    const backgroundElement = document.getElementById('background')
    backgroundElement.style.backgroundImage = ''
    document.body.style.backgroundImage = '' // Clear background when exiting full-screen
  })
  return (
    <div className="App">
      <div id="background"></div>
      <div id="background-overlay"></div>

      {bannerImages.map((img, index) => {
        return (
          <div className="w-full " key={index}>
            <img src={img.src} alt={index.toString()} />
          </div>
        )
      })}

      {!images.length && (
        <>
          <h1 className="bg-red-500">Photo Viewer</h1>
          <button className="border border-solid rounded-sm " onClick={openDirectory}>
            Open Folder
          </button>
        </>
      )}
      <div
        className="flex justify-center items-center overflow-auto fixed bottom-0 right-0 left-0 cursor-pointer  "
        style={{
          background: '#3333'
        }}
      >
        {images.length > 0 &&
          images.map((image: any) => (
            <img
              role="none"
              alt=""
              className="w-[60px] h-[60px] mx-3 my-2 rounded-md"
              src={image.src}
              key={image}
              onClick={() => {
                setBannerImages([image])
              }}
            />
          ))}
      </div>
    </div>
  )
}

export default App
