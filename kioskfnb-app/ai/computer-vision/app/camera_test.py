import cv2

cam = cv2.VideoCapture(0)

while True:

    success, frame = cam.read()

    if not success:
        print("Kamera gagal dibuka")
        break

    cv2.imshow("Camera Test", frame)

    if cv2.waitKey(1) == ord("q"):
        break

cam.release()
cv2.destroyAllWindows()