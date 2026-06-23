import ChatBox from "@/components/ChatBox";

const page = () => {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to ChatBox
        </h1>
        <p className="text-xs text-gray-500 mt-1">Leave a message below.</p>
      </div>
      <ChatBox />
    </main>
  );
};

export default page;
