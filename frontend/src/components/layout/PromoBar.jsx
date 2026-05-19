

export default function PromoBar() {
    return (
      <div className="flex items-center justify-center w-full h-8 bg-[#b1b8f1] text-white">
        <span className="uppercase font-bold">
          clearance sale: up to <span className="text-red-600">60% off</span>
        </span>
      </div>
    );
}