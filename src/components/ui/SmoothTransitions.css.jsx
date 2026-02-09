/* Smooth Page Transitions */
@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pageExit {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.page-enter {
  animation: pageEnter 0.3s ease-out forwards;
}

.page-exit {
  animation: pageExit 0.2s ease-out forwards;
}

/* Smooth Button Press */
@keyframes buttonPress {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
}

.btn-press:active {
  animation: buttonPress 0.2s ease-out;
}

/* Smooth Scroll */
* {
  scroll-behavior: smooth;
}

/* Smooth hover effects */
.smooth-hover {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.smooth-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* Smooth fade in for images */
img {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Smooth loading states */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.shimmer-loading {
  animation: shimmer 2s infinite;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 1000px 100%;
}

/* Smooth color transitions */
.color-transition {
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}

/* Smooth backdrop blur */
@supports (backdrop-filter: blur(10px)) {
  .backdrop-smooth {
    backdrop-filter: blur(10px);
    transition: backdrop-filter 0.3s ease;
  }
}