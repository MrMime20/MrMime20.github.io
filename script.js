<!DOCTYPE html>
<html> 
  <head>
    <title>Bouncy Balls</title> 
  </head>
  <body>
    <!--This draws the canvas on the webpage -->
    <canvas id="mycanvas"></canvas> 
  </body>
  <!-- Include the processing.js library -->
  <!-- See https://khanacademy.zendesk.com/hc/en-us/articles/202260404-What-parts-of-ProcessingJS-does-Khan-Academy-support- for differences -->
  <script src="https://cdn.jsdelivr.net/processing.js/1.4.8/processing.min.js"></script> 
  <script>
  var programCode = function(processingInstance) {
    with (processingInstance) {
      size(400, 400); 
      frameRate(60); // Increased frame rate for smoother animation
      smooth(); // Enable anti-aliasing for smooth rendering
      // The x position of the black ball, starts at 20
      var xPosition = 20;
      // The y position of the white ball, starts at 20
      var yPosition = 20;
      // The speed of the black ball
      var xSpeed = 6;
      // The speed of the white ball
      var ySpeed = 4;
      // Starting score (ALWAYS START AT NEGATIVE 1)
      var scoreDisplay = -1;
      // Starting amount of lives
      var livesDisplay = 10;
      var distance, overlapFlag, randNum, noCornerCase, cornerCaseFlag;
      draw = function() {
          // This code changes the background based on your lives
          if (livesDisplay > 6) {
              background(100, 255, 110);
          }
          else if (livesDisplay > 3) {
              background(255, 255, 0);
          }
          else {
              background(255, 150, 0);
          }
          distance = sqrt(sq(xPosition - mouseX) + sq(mouseY - yPosition));
          textSize(30);
          fill(0, 60, 255);
          text("Score:", 10, 35);
          text(scoreDisplay, 100, 35);
          fill(255, 0, 0);
          text("Lives:", 270, 35);
          text(livesDisplay, 350, 35);
          fill(66, 66, 66);
          xPosition = xPosition + xSpeed;
          yPosition = yPosition + ySpeed;
          fill(0, 0, 0);
          ellipse(xPosition, mouseY, 50, 50);
          fill(255, 255, 255);
          ellipse(mouseX, yPosition, 50, 50);
          if (xPosition > 325 && yPosition > 325 && mouseX > 325 && mouseY > 325 && noCornerCase < 1 && cornerCaseFlag === 0) {
              image(getImage("avatars/mr-pants"), 35, 35, 350, 350);
              fill(0, 0, 0);
              text("Don't have your mouse there!", 2.5, 325);
              fill(255, 0, 0);
              textSize(25);
              text("THIS IS YOUR ONLY WARNING!", 10, 350);
          }
          if (distance === 50 || distance < 50) {
              overlapFlag = 1;
              if(xSpeed > 0) {
                  xSpeed = -6;
              }
              if(ySpeed > 0) {
                  ySpeed = -4;
              }
              if(xSpeed < 0) {
                  xSpeed = 6;
              }
              if(ySpeed < 0) {
                  ySpeed = 4;
              }
          }
          if(overlapFlag===1 && distance > 50){
              overlapFlag = 0;
              livesDisplay--;
          }
          if (xPosition > 375) {
              xSpeed = -6;
          }
          if (yPosition > 375) {
              ySpeed = -4;
              scoreDisplay ++;
          }
          if (xPosition < 25) {
              xSpeed = 6;
          }
          if (yPosition < 25) {
              ySpeed = 4;
              scoreDisplay ++;
          }
          if(livesDisplay <= 0){
              background(255, 0, 0);
              rect(10, 10, 380, 150);
              fill(0, 0, 0);
              text("Just a random number!  " + floor(randNum) + "!", 18, 100); 
              fill(255, 255, 255);
              text("GAME OVER CHUMP", 50, 215);
              fill(225, 185, 185);
              text("You died and scored", 60, 260);
              text(scoreDisplay + " points", 135, 290);
              noLoop();
          }
      };
    }};
    var canvas = document.getElementById("mycanvas"); 
    var processingInstance = new Processing(canvas, programCode); 
  </script>
</html>
