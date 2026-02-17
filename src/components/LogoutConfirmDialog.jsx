import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Typography,
} from "@material-tailwind/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export function LogoutConfirmDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog
      open={open}
      handler={onClose}
      size="sm"
      className="bg-white"
      animate={{
        mount: { scale: 1, y: 0 },
        unmount: { scale: 0.9, y: -20 },
      }}
    >
      <DialogHeader className="flex flex-col items-center justify-center pb-2">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
        </div>
        <Typography variant="h5" color="blue-gray" className="font-bold">
          Confirm Logout
        </Typography>
      </DialogHeader>
      <DialogBody className="px-6 py-4">
        <Typography
          variant="paragraph"
          color="blue-gray"
          className="text-center text-base font-normal"
        >
          Are you sure you want to logout? You will need to sign in again to access your account.
        </Typography>
      </DialogBody>
      <DialogFooter className="flex gap-2 px-6 pb-6">
        <Button
          variant="outlined"
          color="gray"
          onClick={onClose}
          className="flex-1 normal-case"
        >
          Cancel
        </Button>
        <Button
          variant="gradient"
          color="red"
          onClick={onConfirm}
          className="flex-1 normal-case bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
        >
          Logout
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

LogoutConfirmDialog.displayName = "/src/components/LogoutConfirmDialog.jsx";

export default LogoutConfirmDialog;


