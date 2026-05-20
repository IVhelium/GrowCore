
export default function CatalogPopoverCard({ imgSource }) {
    return (
      <div className="flex items-center justify-evenly flex-col">
        <div>
          <img src={imgSource} />
        </div>
      </div>
    );
}